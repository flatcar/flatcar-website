---
title: Running Flatcar Container Linux on Hetzner
linktitle: Running on Hetzner
weight: 20
aliases:
    - ../../os/booting-on-hetzner
    - ../../cloud-providers/booting-on-hetzner
---

[Hetzner Cloud](https://www.hetzner.com/cloud) is a cloud hosting provider.
Flatcar Container Linux is not installable as one of the default operating system options, but you can deploy it by installing it through the rescue OS.

These instructions require Flatcar with version `3941.1.0` or newer.

## Creating snapshots

Snapshots in Hetzner Cloud can be used as a base image to create new servers from. While you can manually create the snapshot, this guide will demonstrate two tools to prepare the snapshots for you.

- [Packer](https://www.packer.io/)
- [hcloud-upload-image](https://github.com/apricote/hcloud-upload-image/)

### Packer

Building the snapshots with Packer allows you to configure the build process to your liking.

#### Requirements

- [Hetzner Cloud API Token](https://docs.hetzner.com/cloud/api/getting-started/generating-api-token/)
- [Packer](https://developer.hashicorp.com/packer)
- [Hetzner Cloud CLI](https://github.com/hetznercloud/cli) (`hcloud`)

#### Template

Packer requires a template that describes how the snapshots should be built. Create a new file `flatcar.pkr.hcl` and paste in the following content:

```hcl
packer {
  required_plugins {
    hcloud = {
      source  = "github.com/hetznercloud/hcloud"
      version = "~> 1.4.0"
    }
  }
}

variable "channel" {
  type    = string
  default = "beta"
}

variable "hcloud_token" {
  type      = string
  default   = env("HCLOUD_TOKEN")
  sensitive = true
}

source "hcloud" "flatcar" {
  token = var.hcloud_token

  image    = "ubuntu-24.04"
  location = "fsn1"
  rescue   = "linux64"

  snapshot_labels = {
    os      = "flatcar"
    channel = var.channel
  }

  ssh_username = "root"
}

build {
  source "hcloud.flatcar" {
    name          = "x86"
    server_type   = "cx22"
    snapshot_name = "flatcar-${var.channel}-x86"
  }

  source "hcloud.flatcar" {
    name          = "arm"
    server_type   = "cax11"
    snapshot_name = "flatcar-${var.channel}-arm"
  }

  provisioner "shell" {
    inline = [
      # Download script and dependencies
      "apt-get -y install gawk",
      "curl -fsSLO --retry-delay 1 --retry 60 --retry-connrefused --retry-max-time 60 --connect-timeout 20 https://raw.githubusercontent.com/flatcar/init/flatcar-master/bin/flatcar-install",
      "chmod +x flatcar-install",

      # Install flatcar
      "./flatcar-install -s -o hetzner -C ${var.channel}",
    ]
  }
}
```

#### Building the snapshots

```shell
export HCLOUD_TOKEN=<your-token>
packer init .

# This will build the snapshot for x86 (amd64-usr) and Arm (arm64-usr).
packer build .
```

The `packer build .` command takes a few minutes to complete. Afterward you can see the snapshot names and IDs:

```shell
==> Builds finished. The artifacts of successful builds are:
--> hcloud.x86: A snapshot was created: 'flatcar-beta-x86' (ID: 157132241)
--> hcloud.arm: A snapshot was created: 'flatcar-beta-arm' (ID: 157132242)
```

You can verify these through the `hcloud` CLI:

```shell
$ hcloud image list --type=snapshot --selector=os=flatcar
ID          TYPE       NAME   DESCRIPTION        ARCHITECTURE   IMAGE SIZE
167650172   snapshot   -      flatcar-beta-arm   arm            0.41 GB
167650577   snapshot   -      flatcar-beta-x86   x86            0.47 GB
```

#### Extended template

If you are looking for an extended Packer template that allows some more customization, check out [github.com/apricote/flatcar-packer-hcloud](https://github.com/apricote/flatcar-packer-hcloud).

### hcloud-upload-image

If you do not want to deal with the complexity of Packer templates, there is an alternative CLI `hcloud-upload-image` that does just that.

#### Requirements

- [Hetzner Cloud API Token](https://docs.hetzner.com/cloud/api/getting-started/generating-api-token/)
- [`hcloud-upload-image`](https://github.com/apricote/hcloud-upload-image)
- [Hetzner Cloud CLI](https://github.com/hetznercloud/cli) (`hcloud`)

#### Building the snapshots

`hcloud-upload-image` does not know anything about Flatcar. We need to construct the URL for the image ourselves.

```shell
export HCLOUD_TOKEN=<your-token>
export CHANNEL=beta
# "current" is the latest version, you can specify alternative version here (e.g 3941.1.0)
export VERSION=current

# For x86 (cx, cpx & ccx Server Types)
hcloud-upload-image upload \
  --architecture=x86 \
  --compression=bz2 \
  --image-url=https://${CHANNEL}.release.flatcar-linux.net/amd64-usr/${VERSION}/flatcar_production_hetzner_image.bin.bz2 \
  --labels os=flatcar,flatcar-channel=${CHANNEL} \
  --description flatcar-${CHANNEL}-x86
 
# For Arm (cax Server Types)
hcloud-upload-image upload \
  --architecture=arm \
  --compression=bz2 \
  --image-url=https://${CHANNEL}.release.flatcar-linux.net/arm64-usr/${VERSION}/flatcar_production_hetzner_image.bin.bz2 \
  --labels os=flatcar,flatcar-channel=${CHANNEL} \
  --description flatcar-${CHANNEL}-arm
```

Running `hcloud-upload-image upload` will take a few minutes to complete. If you need x86 and Arm snapshots, you can run both in parallel.

After it completes, you should see the following output:

```
Successfully uploaded the image! image=167673693
```

You can verify this through the `hcloud` CLI:

```shell
$ hcloud image list --type=snapshot --selector=os=flatcar
ID          TYPE       NAME   DESCRIPTION        ARCHITECTURE   IMAGE SIZE
167673693   snapshot   -      flatcar-beta-x86   x86            0.47 GB
167673694   snapshot   -      flatcar-beta-arm   arm            0.41 GB
```

## Creating servers

### Requirements

- [Butane](../../provisioning/config-transpiler/)
- [Hetzner Cloud CLI](https://github.com/hetznercloud/cli) (`hcloud`)
- Snapshots from the previous section
- SSH Key

Make sure that your SSH Key is available in the current Hetzner Cloud project:

```shell
hcloud ssh-key list

# If not, you can upload the public key:
hcloud ssh-key create --public-key-from-file ~/.ssh/<your-ssh-key>.pub --name my-ssh-key
```

### Server configuration

Flatcar allows you to configure machine parameters, launch systemd units on startup and more via [Butane Configs](../../provisioning/config-transpiler/). These configs are then transpiled into Ignition JSON configs and given to booting machines.
We're going to provide our Butane Config to Hetzner via the user-data flag.

The `coreos-metadata.service` saves metadata variables to `/run/metadata/flatcar`. Systemd units can use them with `EnvironmentFile=/run/metadata/flatcar` in the `[Service]` section when setting `Requires=coreos-metadata.service` and `After=coreos-metadata.service` in the `[Unit]` section.

As an example, this Butane YAML config will start an nginx Docker container and display the instance hostname:

```
variant: flatcar
version: 1.0.0

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
        ExecStartPre=-/usr/bin/bash -c "echo \"Hello from ${COREOS_HETZNER_HOSTNAME:-$COREOS_COREOS_HETZNER_HOSTNAME}\" > /var/www/index.html"
        ExecStart=/usr/bin/docker run --name nginx1 --volume "/var/www:/usr/share/nginx/html:ro" --pull always --log-driver=journald --net host docker.io/nginx:1
        ExecStop=/usr/bin/docker stop nginx1
        Restart=always
        RestartSec=5s
        [Install]
        WantedBy=multi-user.target
```

> There is [a bug](https://github.com/coreos/afterburn/pull/1083) in the currently used version of Afterburn that causes the double prefix in `$COREOS_COREOS_HETZNER_HOSTNAME`.

Before we can create the server, we need to transpile this Butane configuration to the Ignition format:

```shell
docker run --rm -i quay.io/coreos/butane:latest < nginx-example.yaml > nginx-example.json
```

### Create the server

Now that we have the snapshots, SSH Key and our Ignition config, we can finally create the first server:

```shell
# Get ID of the most recent flatcar snapshot for x86
SNAPSHOT_ID=$(hcloud image list --type=snapshot --selector=os=flatcar --architecture=x86 -o=columns=id -o noheader --sort=created:desc | head -n1)

hcloud server create \
  --name flatcar-test \
  --type cpx11 \
  --image ${SNAPSHOT_ID} \
  --ssh-key <your ssh key name or id> \
  --user-data-from-file nginx-example.json
```

This will also take a minute or two to load the snapshot. After the process is finished, you will see the following output:

```
Server 48081481 created
IPv4: 37.27.83.94
IPv6: 2a01:4f9:c012:52f1::1
IPv6 Network: 2a01:4f9:c012:52f1::/64
```

To verify that nginx was properly started, run `curl $(hcloud server ip flatcar-test)`.

You can log in via `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null core@$(hcloud server ip flatcar-test)`.

## Known limitations

These Hetzner Cloud feature do not work with Flatcar:

- **Volume Automount**: You need to mount volumes manually.
- **Setting & Resetting Root Passwords**: You need to configure an SSH Key through the API or Ignition User Data.
