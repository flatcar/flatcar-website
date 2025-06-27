---
title: Running Flatcar Container Linux on Proxmox VE
linktitle: Running on Proxmox VE
weight: 30
---

_While we always welcome community contributions and fixes, please note that Proxmox VE is not an officially supported platform at this time because the release tests don't run for it. (See the [platform overview](/#installing-flatcar).)_

These instructions will walk you through running Flatcar Container Linux on Proxmox VE.

## Choosing a channel

Flatcar Container Linux is designed to be updated automatically with different schedules per channel. You can [disable this feature][update-strategies], although we don't recommend it. Read the [release notes][release-notes] for specific features and bug fixes.

<div id="proxmoxve-create">
  <ul class="nav nav-tabs">
    <li class="active"><a href="#stable-create" data-toggle="tab">Stable Channel</a></li>
    <li><a href="#beta-create" data-toggle="tab">Beta Channel</a></li>
    <li><a href="#alpha-create" data-toggle="tab">Alpha Channel</a></li>
  </ul>
  <div class="tab-content coreos-docs-image-table">
    <div class="tab-pane" id="alpha-create">
      <p>The Alpha channel closely tracks master and is released frequently. The newest versions of system libraries and utilities will be available for testing. The current version is Flatcar Container Linux {{< param alpha_channel >}}.</p>
<pre>
$ wget https://alpha.release.flatcar-linux.net/amd64-usr/current/flatcar_production_proxmoxve_image.img
</pre>
    </div>
    <div class="tab-pane" id="beta-create">
      <p>The Beta channel consists of promoted Alpha releases. The current version is Flatcar Container Linux {{< param beta_channel >}}.</p>
<pre>
$ wget https://beta.release.flatcar-linux.net/amd64-usr/current/flatcar_production_proxmoxve_image.img
</pre>
    </div>
  <div class="tab-pane active" id="stable-create">
      <p>The Stable channel should be used by production clusters. Versions of Flatcar Container Linux are battle-tested within the Beta and Alpha channels before being promoted. The current version is Flatcar Container Linux {{< param stable_channel >}}.</p>
<pre>
$ wget https://stable.release.flatcar-linux.net/amd64-usr/current/flatcar_production_proxmoxve_image.img
</pre>
    </div>
  </div>
</div>


## Creating the VM

Proxmox VE graphical UI only supports ISO images, but the Flatcar image is in qcow2 format.
In order to create a VM with our image, we'll need to use the command line on the Proxmox host.

```bash
export VM_ID=123

# create the vm and import the image to it's disk
qm create $VM_ID --cores 2 --memory 4096 --net0 "virtio,bridge=vmbr0" --ipconfig0 "ip=dhcp"
qm disk import $VM_ID flatcar_production_proxmoxve_image.img local-lvm

# tell the vm to boot from the imported image
qm set $VM_ID --scsi0 local-lvm:vm-$VM_ID-disk-0
qm set $VM_ID --boot order=scsi0

# Create the cloud-init CD-ROM drive which activates the cloud-init options for the VM.
# This is required for using ignition config as well.
qm set $VM_ID --ide2 local-lvm:cloudinit
```

## Configuring the VM with OpenStack-style cloud-init config

Our VM can be booted as-is, however we might want to add a cloud-init configuration.

Select the VM, then go to Hardware and click Add > CloudInit Drive. You can then edit the config from the Cloud-Init tab.

What is supported:

- Setting hostname (hostname is always `$VM_ID`)
- Writing SSH keys
- Writing network configuration


## Configuring the VM using Ignition

> **Important note**: Ignition configuration uses the same `user-data` file than the cloud-init config. This means that you cannot use both Ignition config and regular cloud-init. When setting up an Ignition config, expect the cloud-init services to fail during boot (this is harmless).

Proxmox VE graphical interface does not support setting a custom user-data file. You'll need to use the command line to achieve this.

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
        "name": "core",
        "sshAuthorizedKeys": [
          "ssh-ed25519 your-public-ssh-key"
        ]
      }
    ]
  }
}
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
