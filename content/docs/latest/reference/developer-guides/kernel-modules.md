---
title: Building custom kernel modules
weight: 10
aliases:
    - ../../os/kernel-modules
---

## Create a writable overlay

The kernel modules directory `/usr/lib/modules` is read-only on Flatcar Container Linux. A writable overlay can be mounted over it to allow installing new modules.

**NOTE:** On older releases - 3115.0.0 and before, published before April 2022 - `/usr/lib64/modules` was used instead.
To build for these releases, please use `/usr/lib64/modules` instead of `/usr/lib/modules` (but ideally, update to a more recent version).

### Local test environment

To test the steps below in a local QEmu instance, you'll need to add extra storage to that instance.
The default 6GB rootfs won't suffice as the devcontainer itself is ~6GB (uncompressed; compressed it's ~480MB).
The simplest way to do this is to forward the local host directory to qemu via 9p.

Start the Flatcar instance with:
```bash
./flatcar_production_qemu_uefi.sh [...other options...] -virtfs local,path="$(pwd)",mount_tag="data",security_model=none,id=data
```
Then mount the directory inside the instance and change into the mounted filesystem:
```bash
sudo mount -t 9p -o trans=virtio data /mnt -oversion=9p2000.L
sudo mkdir /mnt/work
sudo chown core:core /mnt/work
cd /mnt/work
```

## Prepare the node

```shell
modules=/opt/modules  # Adjust this writable storage location as needed.
sudo mkdir -p "${modules}" "${modules}.wd"
```

Create a mount unit to use `/opt/modules` at boot - `/etc/systemd/system/usr-lib-modules.mount`:
```ini
[Unit]
Description=Custom Kernel Modules
ConditionPathExists=/opt/modules
Before=sysinit.target
After=systemd-sysext.service
DefaultDependencies=no

[Mount]
Type=overlay
What=overlay
Where=/usr/lib/modules
Options=lowerdir=/usr/lib/modules,upperdir=/opt/modules,workdir=/opt/modules.wd

[Install]
UpheldBy=systemd-sysext.service
```

Enable the unit so this overlay becomes available:

```shell
sudo systemctl enable --now usr-lib-modules.mount
```

## Prepare a Flatcar Container Linux development container

Flatcar release version and group (aka Channel) are stored in info files.
We source these files to construct the devcontainer URL:
```shell
. /usr/share/flatcar/release
. /usr/share/flatcar/update.conf
url="https://${GROUP:-stable}.release.flatcar-linux.net/${FLATCAR_RELEASE_BOARD}/${FLATCAR_RELEASE_VERSION}/flatcar_developer_container.bin.bz2"
```

Now download, decompress, and verify the development container image.

```shell
curl -f -L -O https://www.flatcar.org/security/image-signing-key/Flatcar_Image_Signing_Key.asc
gpg2 --import Flatcar_Image_Signing_Key.asc
curl -L "${url}" |
    tee >(bzip2 -dc | cp --sparse=always /dev/stdin flatcar_developer_container.bin) |
    gpg2 --verify <(curl -Ls "${url}.sig") -
```

Start the development container with the host's writable modules directory mounted into place.
Since the container requires access to loopback devices, `--capability=CAP_NET_ADMIN` is required.
```shell
sudo systemd-nspawn \
    --bind=/usr/lib/modules \
    --capability=CAP_NET_ADMIN \
    --image=flatcar_developer_container.bin
```

Now, inside the container, fetch the Flatcar Container Linux package definitions, then download and prepare the Linux kernel source for building external modules.

```shell
emerge-gitclone
emerge -gKv coreos-sources
gzip -cd /proc/config.gz > /usr/src/linux/.config
make -C /usr/src/linux modules_prepare
```

## Build and install kernel modules

At this point, upstream projects' instructions for building their out-of-tree modules should work in the Flatcar Container Linux development container. New kernel modules should be installed into `/usr/lib/modules`, which is bind-mounted from the host, so they will be available on future boots without using the container again.

In case the installation step didn't update the module dependency files automatically, running the following command will ensure commands like `modprobe` function correctly with the new modules.

```shell
sudo depmod
```
