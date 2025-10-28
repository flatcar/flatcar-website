---
title: Running Flatcar Container Linux on VirtualBox
title: Running on VirtualBox
weight: 30
aliases:
    - ../../os/booting-on-virtualbox
    - ../../cloud-providers/booting-on-virtualbox
---

_While we always welcome community contributions and fixes, please note that VirtualBox is not an officially supported platform at this time. (See the [platform overview](/#installing-flatcar).)_

These instructions will walk you through running Flatcar Container Linux on Oracle VM VirtualBox.

## Building the virtual disk

There is a script that simplifies building the VDI image. It downloads a bare-metal image, verifies it with GPG, and converts that image to a VDI image.

The script is located on [GitHub](https://github.com/flatcar/scripts/blob/main/contrib/create-coreos-vdi). The running host must support VirtualBox tools.

As first step, you must download the script and make it executable.

```shell
wget https://raw.githubusercontent.com/flatcar/scripts/main/contrib/create-coreos-vdi
chmod +x create-coreos-vdi
```

To run the script, you can specify a destination location and the Flatcar Container Linux version.

```shell
./create-coreos-vdi -d /data/VirtualBox/Templates
```

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
      <p>Create a disk image from this channel by running:</p>
<pre>
./create-coreos-vdi -V alpha
</pre>
    </div>
    <div class="tab-pane" id="beta-create">
      <p>The Beta channel consists of promoted Alpha releases. The current version is Flatcar Container Linux {{< param beta_channel >}}.</p>
      <p>Create a disk image from this channel by running:</p>
<pre>
./create-coreos-vdi -V beta
</pre>
    </div>
  <div class="tab-pane active" id="stable-create">
      <p>The Stable channel should be used by production clusters. Versions of Flatcar Container Linux are battle-tested within the Beta and Alpha channels before being promoted. The current version is Flatcar Container Linux {{< param stable_channel >}}.</p>
      <p>Create a disk image from this channel by running:</p>
<pre>
./create-coreos-vdi -V stable
</pre>
    </div>
  </div>
</div>

After the script has finished successfully, the Flatcar Container Linux image will be available at the specified destination location or at the current location. The file name will be something like:

```shell
coreos_production_stable.vdi
```

## Creating a config-drive

Cloud-config can be specified by attaching a [config-drive](https://github.com/flatcar/coreos-cloudinit/blob/master/Documentation/config-drive.md) with the label `config-2`. This is commonly done through whatever interface allows for attaching CD-ROMs or new drives.

Note that the config-drive standard was originally an OpenStack feature, which is why you'll see strings containing `openstack`. This filepath needs to be retained, although Flatcar Container Linux supports config-drive on all platforms.

For more information on customization that can be done with cloud-config, head on over to the [cloud-config guide](https://github.com/flatcar/coreos-cloudinit/blob/master/Documentation/cloud-config.md).

You need a config-drive to configure at least one SSH key to access the virtual machine. If you are in hurry, you can create a basic config-drive with following steps:

```shell
wget https://raw.github.com/flatcar/scripts/main/contrib/create-basic-configdrive
chmod +x create-basic-configdrive
./create-basic-configdrive -H my_vm01 -S ~/.ssh/id_rsa.pub
```

An ISO file named `my_vm01.iso` will be created that will configure a virtual machine to accept your SSH key and set its name to my_vm01.

## Deploying a new virtual machine on VirtualBox

Use the built image as the base image. Clone that image for each new virtual machine and set the desired size.

```shell
VBoxManage clonehd coreos_production_stable.vdi my_vm01.vdi
# Resize virtual disk to 10 GB
VBoxManage modifyhd my_vm01.vdi --resize 10240
```

At boot time, the Flatcar Container Linux will detect that the volume size has changed and will resize the filesystem accordingly.

Open VirtualBox Manager and go to Machine > New. Type the desired machine name and choose 'Linux' as the type and 'Linux 2.6 / 3.x (64 bit)' as the version.

Next, choose the desired memory size; at least 2 GB for an optimal experience.

Then, choose 'Use an existing virtual hard drive file' and find the new cloned image.

Click on the 'Create' button to create the virtual machine.

Next, go to the settings from the created virtual machine. Then click on the Storage tab and load the created config-drive into the CD/DVD drive.

Click on the 'OK' button and the virtual machine will be ready to be started.

## Logging in

Networking can take a bit of time to come up under VirtualBox, and the IP is needed in order to connect to it. Press enter a few times at the login prompt to see an IP address pop up. If you see VirtualBox NAT IP 10.0.2.15, go to the virtual machine settings and click the Network tab then Port Forwarding. Add the rule "Host Port: 2222; Guest Port 22" then connect using the command `ssh core@localhost -p2222`.

Now, login using your private SSH key.

```shell
ssh core@192.168.56.101
```

## Using Flatcar Container Linux

Now that you have a machine booted it is time to play around. Check out the [Flatcar Container Linux Quickstart][quickstart] guide or dig into [more specific topics][doc-index].

[update-strategies]: ../../setup/releases/update-strategies
[release-notes]: https://flatcar-linux.org/releases
[quickstart]: ../
[doc-index]: ../../

