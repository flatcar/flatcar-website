---
title: Running Flatcar on Brightbox
linktitle: Running on Brightbox
weight: 10
---

These instructions will walk you through using Flatcar on Brightbox, importing a custom image, and running your first server using the command line interface. Please note that Brightbox is compatible with OpenStack: it is not a mistake if we refer to OpenStack images and specific variables.

## Import the image

While [Brightbox][brightbox] provides Flatcar images for Beta, Stable and LTS channels it is possible to import your own Flatcar image in Brightbox using the [CLI][cli].

For example, to upload an image from the Flatcar Alpha channel:

```bash
$ brightbox images register \
  --arch=x86_64 --name=flatcar-alpha \
  --url=https://alpha.release.flatcar-linux.net/amd64-usr/current/flatcar_production_openstack_image.img
$ brightbox images list --type=upload
 id         owner      type    created_on  status   size  name
---------------------------------------------------------------------------------
 img-xoufd  acc-jg5aa  upload  2023-12-05  private  8694  flatcar-alpha (x86_64)
---------------------------------------------------------------------------------
```

## Butane Configs

Flatcar allows you to configure machine parameters, launch systemd units on startup and more via Butane Configs. These configs are then transpiled into Ignition JSON configs and given to booting machines. Jump over to the [docs to learn about the supported features][butane-configs]. We're going to provide our Butane Config to Brightbox via the user-data flag. Our Butane Config will also contain SSH keys that will be used to connect to the instance.

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
cat butane.yaml | docker run --rm -i quay.io/coreos/butane:release > ignition.json
```

The `coreos-metadata.service` saves metadata variables to `/run/metadata/flatcar`. Systemd units can use them with `EnvironmentFile=/run/metadata/flatcar` in the `[Service]` section when setting `Requires=coreos-metadata.service` and `After=coreos-metadata.service` in the `[Unit]` section.

## Launch machine

Boot the machines with the CLI, referencing the image ID from the import step above or using an official image ID (`brightbox images list --type=official`) and your [Ignition file from Butane][butane-configs]:

```shell
$ brightbox servers create --cloud-ip=true --user-data-file=./ignition.json img-xoufd
```

Your first Flatcar instance should now be running. The only thing left to do is find the IP address and SSH in.

```shell
$ brightbox servers show $THE_INSTANCE_ID
...
       cloud_ipv4s: 109.107.37.145
...
```

Finally SSH into an instance, note that the user is `core`:

```shell
$ curl 109.107.37.145
Hello from srv-f0lo3.gb1.brightbox.com
$ ssh core@109.107.37.145
core@srv-f0lo3 ~ $ systemctl status nginx
● nginx.service - NGINX example
     Loaded: loaded (/etc/systemd/system/nginx.service; enabled; preset: enabled)
     Active: active (running) since Tue 2023-12-05 16:25:06 UTC; 1min 53s ago
...
```

:warning: In the following example, the default firewall policy created during account registration has been used, which permits access to TCP ports 22 and 80. If you've modified the default firewall policy then you may need to take additional steps to open access. Here’s the documentation to update the firewall policies: https://www.brightbox.com/docs/guides/cli/firewall/

## Using Flatcar Container Linux

Now that you have a machine booted it is time to play around. Check out the [Flatcar Container Linux Quickstart][quickstart] guide or dig into [more specific topics][doc-index].

[butane-configs]: ../../provisioning/config-transpiler
[brightbox]: https://cloud.brightbox.com/
[cli]: https://www.brightbox.com/docs/reference/cli
[doc-index]: ../../
[quickstart]: ../
