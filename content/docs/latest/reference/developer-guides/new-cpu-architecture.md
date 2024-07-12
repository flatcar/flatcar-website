---
title: Porting to a new CPU architecture
weight: 10
---

## Porting Flatcar itself

Porting Flatcar itself to a new CPU architecture is relatively easy because it is technically cross-compiled for all its supported architectures. None of them are considered native. There are a few steps involved.

### Create a new set of profiles

There are Portage profiles for each supported architecture in the [scripts repository][scripts] under `repos/flatcar-overlay/profiles/coreos`. Using arm64 as a template, create a new set for your new architecture. You don't need to copy `arm64/sdk` unless you plan on porting the SDK as well.

### Perform any necessary package keywording

The package ebuilds in the [scripts repository][scripts] are not automatically available to every architecture. Keywords need to be added to make those ebuilds visible.

The ebuilds in the gentoo-subset package repository are taken verbatim from upstream Gentoo, so Flatcar respects the existing keywords wherever possible, making exceptions in the profiles where necessary. You may need to add some new exceptions.

The ebuilds in the flatcar-overlay package repository will lack keywords for your new architecture, so you will need to add them. The `eshowkw`, `ekeyword`, and `pkgcheck` tools are useful here.

### Add the architecture to the build scripts

This is largely a case of finding instances of `arm64-usr` in the [scripts repository][scripts] and adding equivalent code for your new architecture.

This should be sufficient for you to build a new SDK yourself, which will include the toolchain to build for that new architecture. You can then use this to build Flatcar itself.

You will need to ask the Flatcar maintainers to make the necessary adjustments to CI if this new architecture is to be officially supported.

## Porting the SDK

As described above, you don't need an SDK for your new CPU architecture in order to build Flatcar for it. However, it may still be desirable to have such an SDK. The SDK is not cross-compiled, so you need will need to emulate an existing SDK on your new architecture and use an alternative seed tarball.

### Port Flatcar first

While a matching SDK is thankfully not needed to build Flatcar, you still need to do most of the Flatcar porting work to build that SDK. See above. You don't need an actual Flatcar build, but you do need to create an SDK profile, do most of the keywording, and update most of the build scripts.

### Emulate an existing SDK

The SDK for an existing architecture, such as amd64, can be emulated on your new architecture with the help of QEMU. This is slow, but it is only needed to run the build scripts and Catalyst. The actual building is still done natively.

With an existing Linux installation on your new architecture, install the static QEMU userspace emulators. On Ubuntu, the relevant package is `qemu-user-static`. systemd will most likely configure binfmt for you, allowing you to start containers for other architectures.

You can now start the SDK in the same way that you normally would, despite a warning that looks like the following.

> WARNING: The requested image's platform (linux/amd64) does not match the detected host platform (linux/arm64/v8) and no specific platform was requested

### Create an alternative seed

#### Option 1: Use a developer container

If you have already ported Flatcar itself to your new architecture, then developer containers should now be produced. Find a recent build of **flatcar_developer_container.bin.bz2** for that architecture. Unfortunately, this is a disk image, so we need to convert it into a tarball to use as a seed.

```
bunzip2 flatcar_developer_container.bin.bz2
sudo kpartx -a flatcar_developer_container.bin
sudo mkdir /tmp/flatcar_dev
sudo mount -o ro /dev/mapper/loop?p9 /tmp/flatcar_dev
sudo tar -C /tmp/flatcar_dev -Jcf flatcar_developer_container.tar.xz .
sudo umount /tmp/flatcar_dev
sudo kpartx -d flatcar_developer_container.bin
```

#### Option 2: Cross-compile stage 3

Using a recent SDK on an existing architecture like amd64, clone the [cross-boss repository][cross-boss].

The SDK will already have a cross-compiler for your new architecture, but using a non-standard tuple along the lines of `*-cros-linux-gnu`. This tuple ensures that Flatcar is always cross-compiled, regardless of the build host's architecture. For this task though, you need a cross-compiler with the standard tuple. Rather than build a whole new one, which would take a while, you can alias the existing one with symlinks.

```
ARCH=<INSERT PORTAGE ARCH HERE>

# Determine the non-standard tuple.
CROS_TUPLE=$(portageq-${ARCH}-usr envvar CHOST)

# Create output directory with Portage config.
sudo mkdir -p cross-stage3/etc/portage
sudo cp -a /etc/portage/{{make,repos}.conf,patches} cross-stage3/etc/portage/
sudo env ROOT=cross-stage3 eselect profile set --force flatcar-overlay:coreos/${ARCH}/sdk

# Determine the standard tuple.
SDK_TUPLE=$(PORTAGE_CONFIGROOT=cross-stage3 portageq envvar CHOST)

# Alias the cross environment.
sudo ln -sfT ${CROS_TUPLE} /usr/${SDK_TUPLE}

# Alias the cross toolchain.
for BIN in /usr/bin/${CROS_TUPLE}-*; do
  NAME=${BIN##*/}
  sudo ln -sfT "${BIN}" "/usr/local/bin/${SDK_TUPLE}${NAME#${CROS_TUPLE}}"
done

sudo /path/to/cross-boss/bin/cb-bootstrap "${PWD}"/cross-stage3
sudo tar -C cross-stage3 -Jcf flatcar-stage3.tar.xz .
```

[scripts]: https://github.com/flatcar/scripts
[cross-boss]: https://github.com/chewi/cross-boss
