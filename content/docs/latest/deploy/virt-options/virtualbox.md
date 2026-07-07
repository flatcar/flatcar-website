---
title: VirtualBox (community support)
linktitle: VirtualBox (community support)
weight: 250
aliases:
    - /docs/latest/installing/vms/virtualbox/
    - ../../os/booting-on-virtualbox
    - ../../cloud-providers/booting-on-virtualbox
---

_While we always welcome community contributions and fixes, please note that VirtualBox is not an officially supported platform at this time._

These instructions will walk you through running Flatcar Container Linux on Oracle VM VirtualBox.

## Choose a channel

Flatcar Container Linux is designed to be updated automatically with different schedules per channel. You can [disable this feature][update-strategies], although we don't recommend it. Read the [release notes][release-notes] for specific features and bug fixes.

<div id="virtualbox-create">
  <ul class="nav nav-tabs">
    <li class="active"><a href="#stable-create" data-bs-toggle="tab">Stable Channel</a></li>
    <li><a href="#beta-create" data-bs-toggle="tab">Beta Channel</a></li>
    <li><a href="#alpha-create" data-bs-toggle="tab">Alpha Channel</a></li>
  </ul>
  <div class="tab-content coreos-docs-image-table">
    <div class="tab-pane" id="alpha-create">
      <p>The Alpha channel closely tracks master and is released frequently. The newest versions of system libraries and utilities will be available for testing. The current version is Flatcar Container Linux {{< param alpha_channel >}}.</p>
      <p>Download the OVF configuration file and VMDK disk image by running:</p>
<pre>
mkdir flatcar; cd flatcar
wget https://alpha.release.flatcar-linux.net/amd64-usr/current/flatcar_production_virtualbox.ovf
wget https://alpha.release.flatcar-linux.net/amd64-usr/current/flatcar_production_virtualbox.ovf.sig
wget https://alpha.release.flatcar-linux.net/amd64-usr/current/flatcar_production_virtualbox_image.vmdk.bz2
wget https://alpha.release.flatcar-linux.net/amd64-usr/current/flatcar_production_virtualbox_image.vmdk.bz2.sig
</pre>
    </div>
    <div class="tab-pane" id="beta-create">
      <p>The Beta channel consists of promoted Alpha releases. The current version is Flatcar Container Linux {{< param beta_channel >}}.</p>
      <p>Download the OVF configuration file and VMDK disk image by running:</p>
<pre>
mkdir flatcar; cd flatcar
wget https://beta.release.flatcar-linux.net/amd64-usr/current/flatcar_production_virtualbox.ovf
wget https://beta.release.flatcar-linux.net/amd64-usr/current/flatcar_production_virtualbox.ovf.sig
wget https://beta.release.flatcar-linux.net/amd64-usr/current/flatcar_production_virtualbox_image.vmdk.bz2
wget https://beta.release.flatcar-linux.net/amd64-usr/current/flatcar_production_virtualbox_image.vmdk.bz2.sig
</pre>
    </div>
  <div class="tab-pane active" id="stable-create">
      <p>The Stable channel should be used by production clusters. Versions of Flatcar Container Linux are battle-tested within the Beta and Alpha channels before being promoted. The current version is Flatcar Container Linux {{< param stable_channel >}}.</p>
      <p>Download the OVF configuration file and VMDK disk image by running:</p>
<pre>
mkdir flatcar; cd flatcar
wget https://stable.release.flatcar-linux.net/amd64-usr/current/flatcar_production_virtualbox.ovf
wget https://stable.release.flatcar-linux.net/amd64-usr/current/flatcar_production_virtualbox.ovf.sig
wget https://stable.release.flatcar-linux.net/amd64-usr/current/flatcar_production_virtualbox_image.vmdk.bz2
wget https://stable.release.flatcar-linux.net/amd64-usr/current/flatcar_production_virtualbox_image.vmdk.bz2.sig
</pre>
    </div>
  </div>
</div>

## Verify and decompress the image

Ensure that what you have downloaded has a good signature:

```shell
gpg --verify flatcar_production_virtualbox.ovf.sig
gpg --verify flatcar_production_virtualbox_image.vmdk.bz2.sig
```

The disk image needs to be decompressed before use:

```shell
bunzip2 flatcar_production_virtualbox_image.vmdk.bz2
```

## Deploying a new virtual machine on VirtualBox

### Note for Windows users

The following steps use the `VBoxManage` command, which is not in the `PATH` on Windows by default. Temporarily add it to the `PATH` like so:

```powershell
$env:PATH += ";C:\Program Files\Oracle\VirtualBox"
```

### Import the OVF configuration file and VMDK disk image

Importing with no additional arguments will clone the disk image and use the default configuration defined in the OVF. You can give the VM a custom name and override certain properties such as the amount of memory and the number of CPUs. When giving any additional arguments, you must start them with `--vsys=0`.

```shell
VBoxManage import flatcar_production_virtualbox.ovf --vsys=0 --vmname=myflatcar --memory=4096 --cpus=4
```

If you don't give a custom name, one will be generated for you and shown in the output.

### Resize the disk

By default, the root filesystem will hold roughly 12GB. If this is too small, you can resize the image, and Flatcar will adjust the root filesystem at boot time. Find the disk's UUID within the VM's details:

```shell
VBoxManage showvminfo myflatcar
```

Then resize the disk as required:

```shell
VBoxManage modifymedium disk 1f768d59-256f-4fee-96f5-c12624d4f0f0 --resize 20480
```

### Make the VM accessible

If you were to start the VM now, you would not be able to log in because the automatic console login would be disabled, the SSH port would not be exposed, and no SSH keys would be added. Expose the VM's SSH port via port 2222 on the host:

```shell
VBoxManage modifyvm myflatcar --nat-pf1=ssh,tcp,127.0.0.1,2222,,22
```

An SSH key must be inserted into the VM by provisioning it with Ignition. First, write a [Butane configuration]
[butane-configs] containing your public SSH key and transpile it. Then attach the transpiled configuration to the VM as a property:

#### Bash (Linux, macOS)
```shell
VBoxManage guestproperty set myflatcar /Ignition/Config "$(< config.ign)"
```

#### PowerShell (Windows)
```powershell
VBoxManage guestproperty set myflatcar /Ignition/Config (Get-Content -Raw config.ign)
```

Unfortunately, a VirtualBox restriction limits the permitted size of such properties to just 1024 bytes. This is barely enough for an SSH key and/or a URL to a remote configuration. Anything further must therefore be done in a remote configuration. See [Ignition issue #2226](https://github.com/coreos/ignition/issues/2226) for more details.

### Start the VM

Once configured as necessary, start the VM:

```shell
VBoxManage startvm myflatcar
```

This will open a window for the VM's display. You can run the VM headless instead:

```shell
VBoxManage startvm myflatcar --type=headless
```

## Logging in

Assuming you're using NAT networking and have exposed SSH via host port 2222, log in using your private SSH key like so:

```shell
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -l core -p 2222 127.0.0.1
```

## Using Flatcar Container Linux

Now that you have a machine booted it is time to play around. Check out the [Flatcar Container Linux Quickstart][quickstart] guide or dig into [more specific topics][doc-index].

[update-strategies]: ../../updates-releases/releases/update-strategies
[release-notes]: https://flatcar-linux.org/releases
[butane-configs]: ../../fb-provision/butane
[quickstart]: ../../getting-started/quickstart
[doc-index]: ../../
