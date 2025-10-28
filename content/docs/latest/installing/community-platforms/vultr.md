---
title: Running Flatcar Container Linux on a Vultr VPS
linktitle: Running on a Vultr VPS
weight: 10
aliases:
    - ../../os/booting-on-vultr
    - ../../community-platforms/booting-on-vultr
---

These instructions will walk you through running a single Flatcar Container Linux node. This guide assumes:

* You have an account at [Vultr.com](https://www.vultr.com).
* You have a public + private key combination generated. Here's a helpful guide if you need to generate these keys: [How to set up SSH keys](https://help.github.com/articles/generating-ssh-keys).

The simplest option to boot up Flatcar Container Linux is to select the "Flatcar Container Linux Stable" operating system from Vultr's default offerings. However, most deployments require a custom `cloud-config`, which can only be achieved in Vultr with an iPXE script. The remainder of this article describes this process.

## Cloud-config

First, you'll need to make a shell script containing your `cloud-config` available at a public URL:

`cloud-config-bootstrap.sh`:

```shell
#!/bin/bash

cat > "cloud-config.yaml" <<EOF
#cloud-config

ssh_authorized_keys:
  - ssh-rsa ...
EOF

sudo flatcar-install -d /dev/vda -c cloud-config.yaml
sudo reboot
```

Please be sure to check out [Using Cloud-Config](https://github.com/flatcar/coreos-cloudinit/blob/master/Documentation/cloud-config.md).

You must add to your ssh public key to your `cloud-config`'s [ssh authorized keys](https://github.com/flatcar/coreos-cloudinit/blob/master/Documentation/cloud-config.md#ssh_authorized_keys) so you'll be able to log in.

## Choosing a channel

Flatcar Container Linux is designed to be updated automatically with different schedules per channel. You can [disable this feature][update-strategies], although we don't recommend it. Read the [release notes][release-notes] for specific features and bug fixes.

<div id="vultr-images">
  <ul class="nav nav-tabs">
    <li class="active"><a href="#stable" data-bs-toggle="tab">Stable Channel</a></li>
    <li><a href="#beta" data-bs-toggle="tab">Beta Channel</a></li>
    <li><a href="#alpha" data-bs-toggle="tab">Alpha Channel</a></li>
  </ul>
  <div class="tab-content coreos-docs-image-table">
    <div class="tab-pane" id="alpha">
      <div class="channel-info">
        <p>The Alpha channel closely tracks master and is released frequently. The newest versions of system libraries and utilities will be available for testing. The current version is Flatcar Container Linux {{< param alpha_channel >}}.</p>
      </div>
      <p>A sample script will look like this:</p>

<pre>#!ipxe

# Location of your shell script.
set cloud-config-url http://example.com/cloud-config-bootstrap.sh

set base-url https://alpha.release.flatcar-linux.net/amd64-usr/current
kernel ${base-url}/flatcar_production_pxe.vmlinuz cloud-config-url=${cloud-config-url}
initrd ${base-url}/flatcar_production_pxe_image.cpio.gz
boot
</pre>
  </div>
    <div class="tab-pane" id="beta">
      <div class="channel-info">
        <p>The Beta channel consists of promoted Alpha releases. The current version is Flatcar Container Linux {{< param beta_channel >}}.</p>
      </div>
      <p>A sample script will look like this:</p>

<pre>#!ipxe

# Location of your shell script.
set cloud-config-url http://example.com/cloud-config-bootstrap.sh

set base-url https://beta.release.flatcar-linux.net/amd64-usr/current
kernel ${base-url}/flatcar_production_pxe.vmlinuz cloud-config-url=${cloud-config-url}
initrd ${base-url}/flatcar_production_pxe_image.cpio.gz
boot</pre>
  </div>
    <div class="tab-pane active" id="stable">
      <div class="channel-info">
        <p>The Stable channel should be used by production clusters. Versions of Flatcar Container Linux are battle-tested within the Beta and Alpha channels before being promoted. The current version is Flatcar Container Linux {{< param stable_channel >}}.</p>
      </div>
      <p>A sample script will look like this:</p>

<pre>#!ipxe

# Location of your shell script.
set cloud-config-url http://example.com/cloud-config-bootstrap.sh

set base-url https://stable.release.flatcar-linux.net/amd64-usr/current
kernel ${base-url}/flatcar_production_pxe.vmlinuz cloud-config-url=${cloud-config-url}
initrd ${base-url}/flatcar_production_pxe_image.cpio.gz
boot</pre>
  </div>
  </div>
</div>

Go to My Servers > Startup Scripts > Add Startup Script, select type "PXE", and input your script. Be sure to replace the cloud-config-url with that of the shell script you created above.

Additional reading can be found at [Booting Flatcar Container Linux with iPXE][booting-with-ipxe] and [Embedded scripts for iPXE](http://ipxe.org/embed).

## Create the VPS

Create a new VPS (any server type and location of your choice), and then:

1. For the "Operating System" select "Custom"
2. Select "iPXE Custom Script" and the script you created above.
3. Click "Place Order"

Once you receive the "Subscription Activated" email the VPS will be ready to use.

## Accessing the VPS

You can now log in to Flatcar Container Linux using the associated private key on your local computer. You may need to specify its location using `-i LOCATION`. If you need additional details on how to specify the location of your private key file see [here](http://www.cyberciti.biz/faq/force-ssh-client-to-use-given-private-key-identity-file/).

SSH to the IP of your VPS, and specify the "core" user: `ssh core@IP`

```shell
$ ssh core@IP
The authenticity of host 'IP (2a02:1348:17c:423d:24:19ff:fef1:8f6)' can't be established.
RSA key fingerprint is 99:a5:13:60:07:5d:ac:eb:4b:f2:cb:c9:b2:ab:d7:21.
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added '[IP]' (ED25519) to the list of known hosts.
Enter passphrase for key '/home/user/.ssh/id_rsa':
Flatcar Container Linux stable (557.2.0)
core@localhost ~ $
```

## Using Flatcar Container Linux

Now that you have a machine booted it is time to play around. Check out the [Flatcar Container Linux Quickstart][quickstart] guide or dig into [more specific topics][doc-index].

[update-strategies]: ../../setup/releases/update-strategies
[release-notes]: https://flatcar-linux.org/releases
[quickstart]: ../
[doc-index]: ../../
[booting-with-ipxe]: ../../installing/bare-metal/booting-with-ipxe
