---
title: ZFS Extension for Flatcar Container Linux
linktitle: ZFS Extension
description: How to set up storage with the Flatcar ZFS extension.
weight: 40
---

The Flatcar ZFS extension was the first Flatcar extension published, introduced with Flatcar version 3913.0.0 in the Alpha channel. It provides the ZFS Linux kernel modules and the ZFS CLI tools.
Support for ZFS is experimental because the ZFS kernel module lives out-of-tree which means it is not part of the upstream Linux kernel and any delay in fixing incompatibilities in the ZFS code could mean that we would have to release a Flatcar version without the ZFS extension, meaning that ZFS users won't be able update until a follow-up Flatcar release brings ZFS support back.

## Enabling the extension

Users can enable a Flatcar extensions by writing one name per line to `/etc/flatcar/enabled-sysext.conf`. To enable the ZFS extension, one has to write the extension ID `zfs` as line into the file.
