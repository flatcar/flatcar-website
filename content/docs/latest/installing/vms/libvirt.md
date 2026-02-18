---
title: Running Flatcar Container Linux on libvirt
linktitle: Running on libvirt
weight: 30
aliases:
    - ../../os/booting-with-libvirt
    - ../../cloud-providers/booting-with-libvirt
---

This guide explains how to run Flatcar Container Linux with libvirt using the QEMU driver. The libvirt configuration
file can be used (for example) with `virsh` or `virt-manager`. The guide assumes
that you already have a running libvirt setup and `virt-install` tool. If you
don’t have that, other solutions are most likely easier.
At the end of the document there are instructions for deploying with Terraform.

You can direct questions to the [Matrix channel][matrix] or [mailing list][flatcar-dev].

## Download the Flatcar Container Linux image

In this guide, the example virtual machine we are creating is called flatcar-linux1 and
all files are stored in `/var/lib/libvirt/images/flatcar-linux`. This is not a requirement — feel free
to substitute that path if you use another one.

### Choosing a channel

Flatcar Container Linux is designed to be updated automatically with different schedules per channel. You can [disable this feature][update-strategies], although we don't recommend it. Read the [release notes][release-notes] for specific features and bug fixes.

<div id="libvirt-create">
  <ul class="nav nav-tabs">
    <li class="active"><a href="#stable-create" data-bs-toggle="tab">Stable Channel</a></li>
    <li><a href="#beta-create" data-bs-toggle="tab">Beta Channel</a></li>
    <li><a href="#alpha-create" data-bs-toggle="tab">Alpha Channel</a></li>
  </ul>
  <div class="tab-content coreos-docs-image-table">
    <div class="tab-pane" id="alpha-create">
      <p>The Alpha channel closely tracks master and is released frequently. The newest versions of system libraries and utilities will be available for testing. The current version is Flatcar Container Linux {{< param alpha_channel >}}.</p>
      <p>We start by downloading the most recent disk image:</p>
      <pre>
mkdir -p /var/lib/libvirt/images/flatcar-linux
cd /var/lib/libvirt/images/flatcar-linux
wget https://alpha.release.flatcar-linux.net/amd64-usr/current/flatcar_production_qemu_image.img{,.sig}
gpg --verify flatcar_production_qemu_image.img.sig</pre>
    </div>
    <div class="tab-pane" id="beta-create">
      <p>The Beta channel consists of promoted Alpha releases. The current version is Flatcar Container Linux {{< param beta_channel >}}.</p>
      <p>We start by downloading the most recent disk image:</p>
      <pre>
mkdir -p /var/lib/libvirt/images/flatcar-linux
cd /var/lib/libvirt/images/flatcar-linux
wget https://beta.release.flatcar-linux.net/amd64-usr/current/flatcar_production_qemu_image.img{,.sig}
gpg --verify flatcar_production_qemu_image.img.sig</pre>
    </div>
    <div class="tab-pane active" id="stable-create">
      <p>The Stable channel should be used by production clusters. Versions of Flatcar Container Linux are battle-tested within the Beta and Alpha channels before being promoted. The current version is Flatcar Container Linux {{< param stable_channel >}}.</p>
      <p>We start by downloading the most recent disk image:</p>
      <pre>
mkdir -p /var/lib/libvirt/images/flatcar-linux
cd /var/lib/libvirt/images/flatcar-linux
wget https://stable.release.flatcar-linux.net/amd64-usr/current/flatcar_production_qemu_image.img{,.sig}
gpg --verify flatcar_production_qemu_image.img.sig</pre>
    </div>
  </div>
</div>

## Virtual machine configuration

### Ignition config

The preferred way to configure a Flatcar Container Linux machine is via Ignition.

#### Create the Ignition config

Typically you won't write Ignition files yourself, rather you will typically use a tool like the [config transpiler][config-transpiler] to generate them.

However the Ignition file is created, it should be placed in a location which qemu can access. In this example, we'll place it in `/var/lib/libvirt/flatcar-linux/flatcar-linux1/provision.ign`.

Here, for example, we create an empty Ignition config that contains no further declarations besides its specification version:

```shell
mkdir -p /var/lib/libvirt/flatcar-linux/flatcar-linux1/
echo '{"ignition":{"version":"3.4.0"}}' > /var/lib/libvirt/flatcar-linux/flatcar-linux1/provision.ign
```

If the host uses SELinux, allow the VM access to the config:

```shell
semanage fcontext -a -t virt_content_t "/var/lib/libvirt/flatcar-linux/flatcar-linux1"
restorecon -R "/var/lib/libvirt/flatcar-linux/flatcar-linux1"
```

If the host uses AppArmor, allow `qemu` to access the config files:

```shell
echo "  # For ignition files" >> /etc/apparmor.d/abstractions/libvirt-qemu
echo "  /var/lib/libvirt/flatcar-linux/** r," >> /etc/apparmor.d/abstractions/libvirt-qemu
```

Since the empty Ignition config is not very useful, here is an example how to write a simple Butane Config to add your ssh keys and write a hostname file:

```yaml
variant: flatcar
version: 1.1.0
storage:
  files:
  - path: /etc/hostname
    contents:
      inline: "flatcar-linux1"

passwd:
  users:
    - name: core
      ssh_authorized_keys:
        - "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC0g+ZTxC7weoIJLUafOgrm+h..."
```

Assuming that you save this as `example.yaml` (and replace the dummy key with public key), you can convert it to an Ignition config with the [config transpiler][config-transpiler].
Here we run it from a Docker image:

```shell
cat example.yaml | docker run --rm -i quay.io/coreos/butane:release > /var/lib/libvirt/flatcar-linux/flatcar-linux1/provision.ign
```

#### Creating the domain

Once the Ignition file exists on disk, the machine can be configured and started:

```shell
virt-install --connect qemu:///system \
             --import \
             --name flatcar-linux1 \
             --ram 1024 --vcpus 1 \
             --os-variant=unknown \
             --disk size=20,backing_store=/var/lib/libvirt/images/flatcar-linux/flatcar_production_qemu_image.img \
             --graphics=none \
             --qemu-commandline='-fw_cfg name=opt/org.flatcar-linux/config,file=/var/lib/libvirt/flatcar-linux/flatcar-linux1/provision.ign'
```

#### SSH into the machine

By default, libvirt runs its own DHCP server which will provide an IP address to new instances. You can query it for what IP addresses have been assigned to machines:

```shell
$ virsh net-dhcp-leases default
Expiry Time          MAC address        Protocol  IP address                Hostname        Client ID or DUID
-------------------------------------------------------------------------------------------------------------------
 2017-08-09 16:32:52  52:54:00:13:12:45  ipv4      192.168.122.184/24        flatcar-linux1 ff:32:39:f9:b5:00:02:00:00:ab:11:06:6a:55:ed:5d:0a:73:ee
```


To SSH into:

```
ssh core@192.168.122.184
```

### Network configuration

#### Static IP

By default, Flatcar Container Linux uses DHCP to get its network configuration. In this example the VM will be attached directly to the local network via a bridge on the host's virbr0 and the local network. To configure a static address add a [networkd unit][systemd-network] to the Butane Config:

```yaml
variant: flatcar
version: 1.0.0
passwd:
  users:
  - name: core
    ssh_authorized_keys:
    - ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDGdByTgSVHq.......

storage:
  files:
  - path: /etc/hostname
    contents:
      inline: flatcar-linux1
  - path: /etc/systemd/network/10-ens3.network
    contents:
      inline: |
        [Match]
        MACAddress=52:54:00:fe:b3:c0

        [Network]
        Address=192.168.122.2
        Gateway=192.168.122.1
        DNS=8.8.8.8
```

[systemd-network]: http://www.freedesktop.org/software/systemd/man/systemd.network.html

#### Using DHCP with a libvirt network

An alternative to statically configuring an IP at the host level is to do so at the libvirt level. If you're using libvirt's built in DHCP server and a recent libvirt version, it allows configuring what IP address will be provided to a given machine ahead of time.

This can be done using the `net-update` command. The following assumes you're using the `default` libvirt network and have configured the MAC Address to `52:54:00:fe:b3:c0` through the `--network` flag on `virt-install`:

```shell
ip="192.168.122.2"
mac="52:54:00:fe:b3:c0"

virsh net-update --network "default" add-last ip-dhcp-host \
    --xml "<host mac='${mac}' ip='${ip}' />" \
    --live --config
```

By executing these commands before running `virsh start`, we can ensure the libvirt DHCP server will hand out a known IP.

### SSH Config

To simplify this and avoid potential host key errors in the future add the following to `~/.ssh/config`:

```ini
Host flatcar-linux1
HostName 192.168.122.2
User core
StrictHostKeyChecking no
UserKnownHostsFile /dev/null
```

Now you can log in to the virtual machine with:

```shell
ssh flatcar-linux1
```

## Using Flatcar Container Linux

Now that you have a machine booted it is time to play around. Check out the [Flatcar Container Linux Quickstart][quickstart] guide or dig into [more specific topics][doc-index].

## Terraform

The [`libvirt` Terraform Provider](https://github.com/dmacvicar/terraform-provider-libvirt/) lets you describe Flatcar machines declaratively, powering automation that can be reused across bare metal, virtualization, and cloud environments.
Read more about using Terraform and Flatcar [here](../../provisioning/terraform/).

The following snippet shows the simplest working configuration: it downloads the Stable channel image, keeps it immutable, creates a CoW layer for the writable system disk, renders Ignition, and feeds it to the guest via fw_cfg so you can provision a single VM in just a few commands.

Start with a `libvirt-machines.tf` file that contains the main declarations:

```
terraform {
  required_version = ">= 1.0"
  required_providers {
    libvirt = {
      source  = "dmacvicar/libvirt"
      version = "0.9.2"
    }
    ct = {
      source  = "poseidon/ct"
      version = "0.14.0"
    }
  }
}

provider "libvirt" {
  uri = "qemu:///system"
}

data "ct_config" "flatcar" {
  content = <<-YAML
    variant: flatcar
    version: 1.1.0
    passwd:
      users:
        - name: core
          ssh_authorized_keys:
            - ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFakeKeyForDocExampleOnly # fake key. replace with your own!
  YAML
  strict = false
}

resource "libvirt_ignition" "flatcar" {
  name    = "flatcar-simple.ign"
  content = data.ct_config.flatcar.rendered
}

resource "libvirt_volume" "flatcar_base" {
  name = "flatcar-${var.channel}-${var.version}"
  pool = "default"
  # Stable channel QCOW2 from Flatcar. Treat it as immutable; reuse this volume for many VMs.
  create = {
    content = {
      url = "https://${var.channel}.release.flatcar-linux.net/amd64-usr/${var.version}/flatcar_production_qemu_image.img"
...
variable "version" {
  type = string
  default = "current"
}
variable "channel" {
  type = string
  default = "stable"
}
    }
  }
  target = {
    format = {
      type = "qcow2"
    }
  }
}

resource "libvirt_volume" "flatcar_disk" {
  name     = "flatcar-simple-system.qcow2"
  pool     = "default"
  capacity = 21474836480
  # writable disk is a qcow2 overlay so the base image remains untouched (copy-on-write).
  backing_store = {
    path = libvirt_volume.flatcar_base.path
    format = {
      type = "qcow2"
    }
  }
  target = {
    format = {
      type = "qcow2"
    }
  }
}

resource "libvirt_domain" "flatcar_simple" {
  name        = "flatcar-simple"
  memory      = 2048
  memory_unit = "MiB"
  vcpu        = 2
  type        = "kvm"
  autostart   = false

  os = {
    type    = "hvm"
    arch    = "x86_64"
    machine = "q35"
  }

  features = {
    acpi = true # required so QEMU accepts fw_cfg-delivered Ignition on q35/OVMF.
  }

  sys_info = [
    {
      fw_cfg = {
        entry = [
          {
            name = "opt/org.flatcar-linux/config"
            file = libvirt_ignition.flatcar.path
            # fw_cfg delivers the ignition blob directly to the guest firmware.
            value = ""
          }
        ]
      }
    }
  ]

  devices = {
    disks = [
      {
        driver = {
          name = "qemu"
          type = "qcow2"
        }
        target = {
          dev = "vda"
          bus = "virtio"
        }
        source = {
          volume = {
            pool   = libvirt_volume.flatcar_disk.pool
            volume = libvirt_volume.flatcar_disk.name
          }
        }
      }
    ]

    interfaces = [
      {
        model = {
          type = "virtio"
        }
        source = {
          network = {
            network = "default"
          }
        }
        # single virtio interface on the host's default bridge; adjust if you have custom networking.
        mac = {
          address = "52:54:00:45:00:01"
        }
      }
    ]

    consoles = [
      {
        type        = "pty"
        target_type = "virtio"
      }
    ]

    graphics = null
  }

  lifecycle {
    replace_triggered_by = [
      libvirt_volume.flatcar_disk.id
    ]
    # rebuilding the disk happens whenever the system volume changes, e.g., new Ignition config.
  }
}
```

Run `terraform init && terraform plan` followed by `terraform apply` to create (or update) this Flatcar VM; the domain doesn't start automatically. You can start it with `virsh start --console flatcar-simple`, see the autologin console for `core`, or log in via SSH once the IP is printed in the Terraform output. Editing Terraform resources or the Ignition payload alone leaves the existing system disk intact with `firstboot=false`, so rerunning `terraform apply` will not rerun Ignition unless you taint `libvirt_volume.flatcar_disk` (or otherwise recreate that volume) to force a fresh copy-on-write disk.
[flatcar-dev]: https://groups.google.com/forum/#!forum/flatcar-linux-dev
[matrix]: https://app.element.io/#/room/#flatcar:matrix.org
[config-transpiler]: ../../provisioning/config-transpiler
[update-strategies]: ../../setup/releases/update-strategies
[release-notes]: https://flatcar-linux.org/releases
[quickstart]: ../
[doc-index]: ../../
