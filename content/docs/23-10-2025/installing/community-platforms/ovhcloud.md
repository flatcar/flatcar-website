---
title: Running Flatcar on OVHcloud
linktitle: Running on OVHcloud
weight: 10
---

These instructions will walk you through using Flatcar on [OVHcloud][ovhcloud], importing an image, and running your first server using the OpenStack command line interface. Please note that OVHcloud is a community supported platform at the moment which means that the CI does not run on OpenStack images in OVHcloud environment.

Additional note: OVHcloud is compatible with OpenStack: it is not a mistake if we refer to OpenStack images and specific variables.

## Import the image

_Note_: This getting started assumes that OpenStack CLI is already installed and properly configured (see OVHcloud [documentation][ovhcloud-documentation-import])

It is possible to import your own Flatcar image in OVHcloud using the OpenStack CLI. Here's an example, to upload an image from the Flatcar Beta channel:

```bash
$ wget https://beta.release.flatcar-linux.net/amd64-usr/current/flatcar_production_openstack_image.img
$ IMAGE_ID=$(openstack image create \
  --container-format bare \
  --disk-format qcow2 \
  --property image_original_user=core \
  --property hw_qemu_guest_agent=yes \
  --file flatcar_production_openstack_image.img \
  --format value \
  --column id \
  flatcar-beta)
$ echo "${IMAGE_ID}"
efb30d47-3d5f-4ba4-ae7d-03ba3ab6ec43
```

## Butane Configs

Flatcar allows you to configure machine parameters, launch systemd units on startup and more via Butane Configs. These configs are then transpiled into Ignition JSON configs and given to booting machines. Jump over to the [docs to learn about the supported features][butane-configs]. We're going to provide our Butane Config to OVHcloud via the user-data flag. Our Butane Config will also contain SSH keys that will be used to connect to the instance.

As an example, this Butane YAML config will start an Nginx Docker container and display the instance hostname:

```yaml
variant: flatcar
version: 1.0.0
passwd:
  users:
    - name: core
      ssh_authorized_keys:
        - ssh-rsa ABCD...
storage:
  directories:
    - path: /var/www
systemd:
  units:
    - name: nginx.service
      enabled: true
      contents: |
        [Unit]
        Description=NGINX example
        After=docker.service coreos-metadata.service
        Requires=docker.service coreos-metadata.service
        [Service]
        EnvironmentFile=/run/metadata/flatcar
        TimeoutStartSec=0
        ExecStartPre=-/usr/bin/docker rm --force nginx1
        ExecStartPre=-/usr/bin/bash -c "echo 'Hello from ${COREOS_OPENSTACK_HOSTNAME}' > /var/www/index.html"
        ExecStart=/usr/bin/docker run --name nginx1 --volume "/var/www:/usr/share/nginx/html:ro" --pull always --log-driver=journald --net host docker.io/nginx:1
        ExecStop=/usr/bin/docker stop nginx1
        Restart=always
        RestartSec=5s
        [Install]
        WantedBy=multi-user.target
```

Transpile it to Ignition JSON:

```bash
docker run --rm -i quay.io/coreos/butane:release < butane.yaml > ignition.json
```

The `coreos-metadata.service` saves metadata variables to `/run/metadata/flatcar`. Systemd units can use them with `EnvironmentFile=/run/metadata/flatcar` in the `[Service]` section when setting `Requires=coreos-metadata.service` and `After=coreos-metadata.service` in the `[Unit]` section.

## Launch machine

From here, there are a few options:
* boot the instance from the OVHcloud portal
* boot the instance from the OpenStack CLI

### From the OVHcloud portal

The official [documentation][ovhcloud-documentation-create] can be used except for the step 3 "Select an image": you need to go to "Backups" to select your imported image (e.g "flatcar-beta").

You can also add the SSH key to be used in the creation form (it will be fetched and injected into Flatcar by the `coreos-metadata-sshkeys@.service`).

To use Ignition, you need to add the content of the Ignition configuration into the "Post-install script" available at the step 4 "Configure your instance".

### From the OpenStack CLI

Boot the machine with the CLI, referencing the image ID from the import step above, your [Ignition file from Butane][butane-configs], a flavor of your choice and a network of your choice:

```shell
$ INSTANCE_ID=$(openstack server create \
  --network "${NETWORK_ID}" \
  --flavor "${FLAVOR_ID}" \
  --user-data ./ignition.json \
  --image "${IMAGE_ID}" \
  --format value \
  --column id \
  flatcar-01)
```

Your first Flatcar instance should now be running. At this point, the instance should be visible in the OVHcloud portal too. The only thing left to do is find the IP address and SSH in.

Example:
```shell
$ openstack server show "${INSTANCE_ID}" --format json | jq -r .addresses
{
  "Ext-Net": [
    "57.128.163.211",
    "2001:41d0:801:1000::10d4"
  ]
}
$ curl 57.128.163.211
Hello from flatcar-01
```

Finally SSH into an instance, note that the user is `core`:

Example:
```shell
$ ssh core@57.128.163.211
$ systemctl status nginx
● nginx.service - NGINX example
     Loaded: loaded (/etc/systemd/system/nginx.service; enabled; preset: enabled)
     Active: active (running) since Tue 2024-05-28 14:36:37 UTC; 6min ago
    Process: 1586 ExecStartPre=/usr/bin/docker rm --force nginx1 (code=exited, status=0/SUCCESS)
    Process: 1592 ExecStartPre=/usr/bin/bash -c echo 'Hello from ${COREOS_OPENSTACK_HOSTNAME}' > /var/www/index.html (code=exited, status=0/SUCCESS)
    ...
```

## Using Flatcar Container Linux

Now that you have a machine booted it is time to play around. Check out the [Flatcar Container Linux Quickstart][quickstart] guide or dig into [more specific topics][doc-index].

[butane-configs]: ../../provisioning/config-transpiler
[doc-index]: ../../
[ovhcloud]: https://www.ovhcloud.com/en/
[ovhcloud-documentation-create]: https://help.ovhcloud.com/csm/en-public-cloud-compute-getting-started?id=kb_article_view&sysparm_article=KB0051009
[ovhcloud-documentation-import]: https://help.ovhcloud.com/csm/en-public-cloud-compute-upload-own-image?id=kb_article_view&sysparm_article=KB0051325
[quickstart]: ../
