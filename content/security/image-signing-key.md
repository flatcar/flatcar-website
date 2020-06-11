---
title: "Image Signing Key"
date: 2018-04-17T19:00:09+02:00
draft: false
key: /security/image-signing-key/Flatcar_Image_Signing_Key.asc
---

Images hosted at https://stable.release.flatcar-linux.net, https://beta.release.flatcar-linux.net and https://alpha.release.flatcar-linux.net are signed with a GPG key with an ID of E25D9AED0593B34A.
The key can be downloaded below.

**[Download the Image Signing Key]({{< param key >}})**

## Usage

Download the key and import it into your local GPG key ring:

``` bash
$ cd /tmp
$ curl -LO https://www.flatcar-linux.org/security/image-signing-key/Flatcar_Image_Signing_Key.asc
$ gpg --import Flatcar_Image_Signing_Key.asc
gpg: key 0xE25D9AED0593B34A: public key "Flatcar Buildbot (Official Builds) <buildbot@flatcar-linux.org>" imported
gpg: Total number processed: 1
gpg:               imported: 1
```

To verify the integrity of a file, you can now use GPG's `--verify` command.

For example, to verify a `flatcar_production_pxe_image.cpio.gz` image file:

``` bash
$ gpg --verify flatcar_production_pxe_image.cpio.gz.sig flatcar_production_pxe_image.cpio.gz
```

## Image Signing Key

{{< codefromfile >}}
