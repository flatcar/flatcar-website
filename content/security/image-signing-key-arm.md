---
title: Image Signing Key (ARM)
date: 2019-10-10T16:40:00+02:00
draft: false
key: "/security/image-signing-key/Flatcar_ARM_Testing_Key.asc"
---

For testing experimental Flatcar ARM64 images, we need a GPG key with an ID of A7D6E04307F00419. The key can be downloaded below.

**[Download the key for testing Flatcar ARM]({{< param key >}})**

## Usage

Download the key and import it into your local GPG key ring:

``` bash
$ cd /tmp
$ curl -LO https://www.flatcar-linux.org/security/image-signing-key/Flatcar_ARM_Testing_Key.asc
$ gpg --import Flatcar_ARM_Testing_Key.asc
gpg: key 0xA7D6E04307F00419: public key "Flatcar ARM testing key (key for testing experimental Flatcar ARM images) <buildbot@flatcar-linux.org>"
gpg: Total number processed: 1
gpg:               imported: 1
```

To verify the integrity of a file, you can now use GPG's `--verify` command.

For example, to verify a `flatcar_production_pxe_image.cpio.gz` image file:

``` bash
$ gpg --verify flatcar_production_pxe_image.cpio.gz.sig flatcar_production_pxe_image.cpio.gz
```

## Flatcar ARM image testing key

{{< codefromfile >}}