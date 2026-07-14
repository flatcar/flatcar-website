---
title: Vagrant (community support)
linktitle: Vagrant (community support)
weight: 240
aliases:
    - ../../os/booting-on-vagrant
    - ../../cloud-providers/booting-on-vagrant
    - /docs/latest/installing/vms/vagrant/
---

_While we always welcome community contributions and fixes, please note that Vagrant is not an officially supported platform at this time._

Running Flatcar Container Linux with Vagrant is one way to bring up a single machine or virtualize an entire cluster on your laptop.

You can direct questions to the [Discord server][discord] or [mailing list][flatcar-dev].

## Install Vagrant and VirtualBox (or Parallels)

Vagrant is a simple-to-use command line virtual machine manager. There are install packages available for Windows, Linux, and macOS. Find the latest installer on the [Vagrant downloads page](https://developer.hashicorp.com/vagrant/install).

Vagrant is most commonly used in conjunction with [VirtualBox](https://www.virtualbox.org), which is free. It also supports several more "providers", but the only other one supported by Flatcar is [Parallels](https://www.parallels.com/products/desktop/) on macOS.

## Install Flatcar Container Linux

Vagrant's images are known as boxes. They are shipped alongside JSON-based metadata. Unfortunately, Vagrant doesn't support verifying the metadata's signature with GPG, but it does at least verify the box's checksum. The following assumes the Flatcar **alpha** channel. Select your chosen provider when prompted.

```text
$ vagrant box add https://alpha.release.flatcar-linux.net/amd64-usr/current/flatcar_production_vagrant.json
==> box: Loading metadata for box 'https://alpha.release.flatcar-linux.net/amd64-usr/current/flatcar_production_vagrant.json'
This box can work with multiple providers! The providers that it
can work with are listed below. Please review the list and choose
the provider you will be working with.

1) virtualbox
2) parallels

Enter your choice: 1
==> box: Adding box 'flatcar-alpha' (v4669.0.0) for provider: virtualbox (amd64)
    box: Downloading: https://bincache.flatcar-linux.net/images/amd64/4669.0.0/flatcar_production_vagrant.box
    box: Calculating and comparing box checksum...
==> box: Successfully added box 'flatcar-alpha' (v4669.0.0) for 'virtualbox' (amd64)!
```

Create the configuration file for your environment, known as a `Vagrantfile`.

```text
$ vagrant init flatcar-alpha
A `Vagrantfile` has been placed in this directory. You are now
ready to `vagrant up` your first virtual environment! Please read
the comments in the Vagrantfile as well as documentation on
`vagrantup.com` for more information on using Vagrant.
```

## Starting a single machine

You can customise the `Vagrantfile` at this point, but it will support a single machine without any changes. Bring up the VM and connect to it with SSH:

```bash
vagrant up
vagrant ssh
```

It will continue to run in the background. Don't forget to destroy it to free up resources:

```bash
vagrant destroy
```

## Starting a cluster

Additional machines can be defined in the `Vagrantfile`. They can be configured differently. See Vagrant's documentation for more details.

```ruby
Vagrant.configure('2') do |config|
  config.vm.define 'flatcar-01' do |c|
  end
  config.vm.define 'flatcar-02' do |c|
  end
  config.vm.define 'flatcar-03' do |c|
  end
end
```

`vagrant up` will bring up all of them. To see the status of each:

```bash
$ vagrant status
Current machine states:

flatcar-01                running (virtualbox)
flatcar-02                running (virtualbox)
flatcar-03                running (virtualbox)

This environment represents multiple VMs. The VMs are all listed
above with their current state. For more information about a specific
VM, run `vagrant status NAME`.
```

To connect to one of the machines, specify the name:

```bash
vagrant ssh flatcar-01
```

## Shared folder setup

You can optionally share a folder from your laptop into the virtual machine by modifying the `Vagrantfile`. This is useful for easily getting code and other files into the environment. Note that Flatcar does not include VirtualBox's shared folder driver, so NFS-based sharing must be used. Flatcar also disables NFS over UDP as recommended, but Vagrant still uses it by default, so tell it to use TCP instead. The default NAT network is not sufficient for NFS, so a private network is needed too. Adjust the IP address as necessary.

```ruby
config.vm.synced_folder ".", "/home/core/share", id: "core", type: "nfs", nfs_udp: false
config.vm.network "private_network", ip: "192.168.33.10"
```

Use `vagrant reload` to apply this to your existing VM. Vagrant needs to modify `/etc/exports`, so you will be prompted for your local machine password.

## New box versions

Flatcar Container Linux is a rolling release distribution and versions that are out of date will automatically update. To initially deploy VMs with the most recent version, you must fetch the latest box file. Vagrant remembers where to download this from. This assumes you used a "current" URL when you initially added the box.

```bash
vagrant box update
```

## Provisioning

Vagrant can do some provisioning by itself, but Flatcar is usually provisioned with Ignition or cloud-config. These can be used in conjunction with Vagrant, but Parallels is not supported by Ignition.

### Ignition

Write a [Butane configuration][butane-configs] and transpile it, placing the resulting file alongside the `Vagrantfile` as `config.ign`. Vagrant will then pick it up automatically.

Unfortunately, a VirtualBox restriction limits the permitted size of `config.ign` to just 1024 bytes. This is barely enough for an SSH key and/or a URL to a remote configuration. Anything further must therefore be done in a remote configuration. See [Ignition issue #2226](https://github.com/coreos/ignition/issues/2226) for more details.

### cloud-config

Simply put your cloud-config file alongside the `Vagrantfile` as `user-data`. Vagrant will then pick it up automatically. Note that cloud-config is considered a legacy mechanism.

## Using Flatcar Container Linux

Now that you have a machine booted it is time to play around. Check out the [Flatcar Container Linux Quickstart][quickstart] guide or dig into [more specific topics][doc-index].

[flatcar-dev]: https://groups.google.com/forum/#!forum/flatcar-linux-dev
[discord]: https://discord.gg/PMYjFUsJyq
[butane-configs]: ../../fb-provision/butane
[quickstart]: ../../getting-started/quickstart
[doc-index]: ../../
