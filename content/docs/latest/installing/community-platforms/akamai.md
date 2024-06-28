---
title: Running Flatcar on Akamai Connected Cloud (Linode)
linktitle: Running on Akamai
weight: 10
---

These instructions will walk you throug running Flatcar on [Akamai Connected
Cloud][akamai-connected-cloud] (Linode).

## Choosing a region

For the commands we will execute in this guide, we are going to export an
environment variable holding our desired compute region:

```bash
export REGION="us-ord"
```

Feel free to change this to your preferred region.
For a complete list of regions, see [Linode &mdash; Region
Availability][linode-region-availability].

## Importing an Image

_Note_: This getting started guide assumes you have already installed and
configured the [linode-cli][linode-cli].

First, retrieve an Akamai-branded image.
The following example uses URLs for the "alpha" release channel.

```bash
wget https://alpha.release.flatcar-linux.net/amd64-usr/current/flatcar_production_akamai_image.bin.gz
```

Now you can use the linode-cli(1) tool to upload the image.
The following example will upload the image and store the image's ID in a
variable for later use:

```bash
linode-cli image-upload \
    --region "${REGION}" \
    --label "flatcar-linux-alpha" \
    --description "Flatcar Linux (alpha)" \
    --cloud-init \
    flatcar_production_akamai_image.bin.gz

export IMAGE_ID=$(linode-cli images list --label flatcar-linux-alpha --json | jq -r '.[0].id')
```

_Note_: User image uploads are currently limited to 6GiB when being uploaded, as
well as when the image is processed after upload.
If the image is larger than 6GiB when decompressed, the upload and
post-processing steps will indicate no error, but the image will fail to appear
in the Linode API, as well as the [Linode Cloud Manager][linode-cloud-manager].
You can check the image by running `du -h` against the _uncompressed_ image:

```bash
du -h flatcar_production_akamai_image.bin.gz
```

## Butane Configuration

Flatcar allows you to configure machine parameters, launch systemd units on
startup, and more via Butane configurations.
These configurations are translated into Ignition JSON configurations and can be
given to booting machines through instance userdata via the [Linode Metadata
Service][linode-metadata-service].

As an example, the following Butane configuration will start a Docker container,
running  nginx, and displaying the instance's label:

```yaml
variant: flatcar
version: 1.0.0
passwd:
  users:
    - name: core
      ssh_authorized_keys:
        - ssh-ed25519 ...
storage:
  directories:
    - path: /var/www
systemd:
  units:
    - name: nginx.service
      enabled: true
      contents: |
        [Unit]
        Description=nginx example
        After=docker.service coreos-metadata.service
        Requires=docker.service coreos-metadata.service
        [Service]
        EnvironmentFile=/run/metadata/flatcar
        TimeoutStartSec=0
        ExecStartPre=-/usr/bin/docker rm --force nginx1
        ExecStartPre=-/usr/bin/bash -c "echo 'Hello from ${COREOS_AKAMAI_INSTANCE_LABEL}' > /var/www/index.html"
        ExecStart=/usr/bin/docker run --name nginx1 --volume "/var/www:/usr/share/nginx/html:ro" --pull always --log-driver=journald --net host docker.io/nginx:1
        ExecStop=/usr/bin/docker stop nginx1
        Restart=always
        RestartSec=5s
        [Install]
        WantedBy=multi-user.target
```

> **NOTE**: If you do not require Ignition, SSH keys associated to the user account will be injected via Akamai metadata service.

Translate the Butane configuration to the JSON expected by Ignition:

```bash
docker run --rm -i quay.io/coreos/butane:release < butane.yaml > ignition.json
```

The `coreos-metadata.service` unit saves metadata variables to
`/run/metadata/flatcar`.
systemd units can use them with

```
EnvironmentFile=/run/metadata/flatcar
```

in the `[Service]` section, when setting `Requires=coreos-metadata.service` and
`After=coreos-metadata.service` in the `[Unit]` section.

## Booting an Instance

Booting a Linode with Flatcar requires us to

* Create a new, unbooted Linode instance;
* Create an instance disk from our image;
* Create an instance boot configuration that uses the disk with our image on it.

### Create the Instance

Create a new Linode instance that is **not booted**.
For convenience, we will retrieve the new Linode's ID and store it in an
environment variable:

```bash
linode-cli linodes create \
    --region "${REGION}" \
    --booted false \
    --type g6-nanode-1 \
    --metadata.user_data "$(base64 -w0 ignition.json)" \
    --label flatcar \
    --no-defaults

export LINODE_ID=$(linode-cli linodes list --label flatcar --json | jq -r '.[0].id')
```

### Create an Instance Disk

Before we create the instance disk, we will need to know the maximum, allowed
disk size for our instance type.
In the previous command, we used a `g6-nanode-1` instance type.

```bash
export INSTANCE_MAX_DISK_SIZE=$(linode-cli linodes type-view g6-nanode-1 --json | jq -r '.[0].disk')
```

Create an instance disk that will contain our uploaded image:

```bash
linode-cli linodes disk-create \
    --size "${INSTANCE_MAX_DISK_SIZE}" \
    --label flatcar-boot \
    --image "${IMAGE_ID}" \
    --root_pass "mypassword" \
    --no-defaults \
    "${LINODE_ID}"

export DISK_ID=$(linode-cli linodes disks-list --json "${LINODE_ID}" | jq -r '.[0].id')
```

> **NOTE**: The `--root_pass` flag is required by the Linode API, however this
> will have no effect, and the root user's password will not be set.
> The root password gets set by a Linode "helper" which currently does not
> support Flatcar Linux.

### Create an Instance Configuration Profile

The following command will create an instance configuration profile, called
`default`, that disables all of the Linode "helpers", and tells the platform to
boot directly from `/dev/sda`:

```bash
linode-cli linodes config-create \
    --kernel linode/direct-disk \
    --helpers.updatedb_disabled true \
    --helpers.distro false \
    --helpers.modules_dep false \
    --helpers.network false \
    --helpers.devtmpfs_automount false \
    --label default \
    --devices.sda.disk_id "${DISK_ID}" \
    --root_device sda \
    "${LINODE_ID}"
```

### Booting the Instance

Finally, with the image, disk, and configuration profile in place, we can boot
our Linode:

```bash
linode-cli linodes boot "${LINODE_ID}"
```

## Using Flatcar Container Linux

Now that you have a running Flatcar instance, it is time to play around!
Check out the [Flatcar Container Linux Quickstart][quickstart] guide, or dig
into [more specific topics][doc-index].

[akamai-connected-cloud]: https://www.linode.com/
[doc-index]: ../../
[linode-api]: https://www.linode.com/docs/api/
[linode-cli]: https://www.linode.com/docs/products/tools/cli/
[linode-cloud-manager]: https://cloud.linode.com/
[linode-metadata-service]: https://www.linode.com/docs/products/compute/compute-instances/guides/metadata-api/
[linode-region-availability]: https://www.linode.com/global-infrastructure/availability/
[quickstart]: ../
