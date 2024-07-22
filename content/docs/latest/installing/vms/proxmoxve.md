---
title: Running Flatcar Container Linux on Proxmox VE
linktitle: Running on Proxmox VE
weight: 30
---

_While we always welcome community contributions and fixes, please note that Proxmox VE is not an officially supported platform at this time because the release tests don't run for it. (See the [platform overview](/#installing-flatcar).)_

These instructions will walk you through running Flatcar Container Linux on Proxmox VE.

## Choose a channel

Flatcar Container Linux is designed to be updated automatically with different schedules per channel. You can [disable this feature][update-strategies], although we don't recommend it. Read the [release notes][release-notes] for specific features and bug fixes.

Promox VE OEM images are created for both amd64 and arm64 and come in qcow2 compressed format.

How to download a Promox VE qcow2 image file:

```bash
# THIS IS A DEVELOPMENT BUILD
# TODO: update link with an alpha build
wget http://bincache.flatcar-linux.net/images/amd64/9999.0.102+kai-proxmox-support/flatcar_production_proxmoxve_image.img.bz2 | bzip2 -d > flatcar_production_proxmoxve_image.img
```

## Preparing the image

Promox VE graphical UI only supports ISO images, but the Flatcar image is in QCOW2 format.
In order to create a VM with our image we'll need to use the command line. Open a shell on the hypervisor, download the image and convert it to RAW :

```bash
qemu-img convert -f qcow2 -O raw flatcar_production_proxmoxve_image.img flatcar_production_proxmoxve_image.bin
```

## Creating the VM

Because our image is not in ISO format we'll need to use the command-line to create the VM.

```bash
export VM_ID=123

# create the vm and import the image to it's disk
qm create $VM_ID
qm disk import $VM_ID flatcar_production_proxmoxve_image.bin local

# tell the vm to boot from the imported image
qm set $VM_ID --scsi0 local:$VM_ID/vm-$VM_ID-disk-0.raw
qm set $VM_ID --boot order=scsi0
```

## Configuring the VM with Openstack-style cloud-init config

Our VM can be booted as-is, however we might want to add a cloud-init configuration.

Select the VM, then go to Hardware and click Add > CloudInit Drive. You can then edit the config from the CloudInit tab.

What is supported :

- Setting hostname (hostname is always $VM_ID)
- Writing SSH keys
- Writing network configuration

## Configuring the VM using Ignition

> **Important note**: Ignition configuration uses the same `user-data` file than the cloud-init config. This means that you cannot use both Ignition config and regular cloud-init. When setting up an Ignition config, expect the cloud-init services to fail during boot (this is harmless).

Promox VE graphical interface does not support setting a custom user-data file. You'll need to use the command line to achieve this.

First of all we need to write the Ignition config as as snippet. Snippets are located at `/var/lib/vz/snippets` on the hypervisor. Write a file named `user-data` containing your Ignition config. Here is an example :

```bash
cat /var/lib/vz/snippets/user-data

{
  "ignition": { "version": "3.0.0" },
  "storage": {
    "files": [{
      "path": "/etc/someconfig",
      "mode": 420,
      "contents": { "source": "data:,example%20file%0A" }
    }]
  },
  "passwd": {
    "users": [
      {
        "name": "toto",
        "passwordHash": "$6$fdcVz5Na2Kklqcuq$roqjSQpcqyAVNIK8BmeoD1Hypq28unTUuJkc8EAn1rnJ0eTsUuscEhtycmn8cJuyaWleqBJ37yxgxkcxC47H8.",
        "sshAuthorizedKeys": [
          "ssh-rsa your-public-ssh-key"
        ]
      }
    ]
  }
}
```

The password hash was obtained by running `mkpasswd` :

```bash
echo "toto" | mkpasswd --method=SHA-512 --stdin
```

Finally, tell the VM to use this file as `user-data` :

```bash
qm set $VM_ID --cicustom "user=local:snippets/user-data"
```

## Using Flatcar Container Linux

Now that you have a machine booted it is time to play around. Check out the [Flatcar Container Linux Quickstart][quickstart] guide or dig into [more specific topics][doc-index].

[update-strategies]: ../../setup/releases/update-strategies
[release-notes]: https://flatcar-linux.org/releases
[quickstart]: ../
[doc-index]: ../../
