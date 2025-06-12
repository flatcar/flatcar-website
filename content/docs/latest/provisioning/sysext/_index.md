---
title: Systemd-sysext
description: Extending the base OS with systemd-sysext images
weight: 39
---

Flatcar Container Linux bundles various software components with fixed versions together into one release.
For users that require a particular version of a software component this means that the software needs to be supplied out of band and overwrite the built-in software copy.
In the past Torcx was introduced as a way to switch between Docker versions.
Another approach we recommended was to [store binaries in `/opt/bin`](../../container-runtimes/use-a-custom-docker-or-containerd-version/) and prefer them in the `PATH`.

For long time already, the systemd project provided the portable services feature to address deploying custom services.
However, since it only covered the service itself without making the client binaries available on the user, it didn't really fit the use case fully.
The systemd-sysext feature finally provides a way to extend the base OS with a `/usr` overlay, thereby making custom binaries available to the user.
While systemd-sysext images are not really good yet at including systemd units, Flatcar ships `ensure-sysext.service` as workaround to automatically load the image's services.
Systemd-sysext is supported in Flatcar versions ≥ 3185.0.0 for user provided sysext images.

Here's some blog posts you can read for more context:
1. https://www.flatcar.org/blog/2024/04/os-innovation-with-systemd-sysext/
2. https://www.flatcar.org/blog/2023/07/summer-2023-my-internship-experience/
3. https://www.flatcar.org/blog/2023/12/extending-flatcar-say-goodbye-to-torcx-and-hello-to-systemd-sysext/

## Torcx deprecation

Since systemd-sysext is a more generic and maintained solution than Torcx, it replaced Torcx since Flatcar version 3794.0.0 and the last major version to include Torcx was 3760.
Any Torcx usage should be migrated by converting your Torcx image with the `convert_torcx_image.sh` helper script from the [`sysext-bakery`][sysext-bakery] repository, mentioned later in this document. The inbuilt Docker and containerd versions can be disabled which is also showed further below.

## Types of systemd-sysext images

For Flatcar, two types of systemd-sysext images are provided:

- Official:
  - enabled: These are extensions that are shipped along with the base image like Docker, Containerd, OEM partition. These are "opt-out".
  - disabled: These are "opt-in" like ZFS, Podman or Python and one needs to write the extension name in `/etc/flatcar/enabled-sysext.conf` to pull the extension at boot. Similar to enabled extensions, those are built in Flatcar's CI and are distributed from the release servers. 
- Community supported: These are extensions from the Flatcar [sysext-bakery releases](https://github.com/flatcar/sysext-bakery/releases) and they are not tested in CI. 

## OEM software as systemd-sysext images

The Flatcar cloud images differ in the OEM vendor tools they provide in addition to the base image. In the past this was done through binaries on the OEM partition. Since Flatcar version 3760.0.0 most OEM images have been converted to use systemd-sysext images stored on the OEM. They are covered by the Flatcar A/B update mechanism because they are bound to the OS version they were released and tested with, also due to dynamic linking. Those users that run their own Nebraska update server need to make sure that they have a recent version that provides the OEM payloads.

## Flatcar Release Extensions ("official")

Official extensions provided as part of a Flatcar release make Flatcar more modular. Users have different demands while the base image should stay small. Certain software is bound to a particular OS version and can't be provided as out-of-band extension because it needs to be updated together with the OS. In the past this meant we had to find a compromise but soon Flatcar can support more use cases and might even reduce the base image contents further. Those users that run their own Nebraska update server need to make sure that they have a recent version that provides the Flatcar extension payloads.

The table below give an overview on the supported Flatcar extensions.

| Extension Name                       | Availability        | Documentation             |   Enabled by default    |
|--------------------------------------|---------------------|---------------------------|-------------------------|
| `containerd-flatcar`                 | 3794.0.0  – …       |                           |           ✅            |
| `docker-flatcar`                     | 3794.0.0  – …       |                           |           ✅            |
| `flatcar-incus`                      | 4285.0.0  – …       | [Incus][incusextension]   |                         |
| `flatcar-nvidia-drivers-*`           | 4344.0.0 – …        | [NVIDIA][nvidiaextension] |                         |
| `flatcar-podman`                     | 3941.0.0 – …        |                           |                         |
| `flatcar-python`                     | 4012.0.0 – …        |                           |                         |
| `flatcar-zfs`                        | 3913.0.0 – …        | [Storage][zfsextension]   |                         |
| `oem-*`                              | 3760.2.0 – …        |                           |           ✅            |

Users can enable Flatcar extensions by writing one name per line to `/etc/flatcar/enabled-sysext.conf`.
For now there are no pre-enabled release extensions but once Flatcar would move parts of the base image out into extensions, these would be pre-enabled as entries in `/usr/share/flatcar/enabled-sysext.conf`. They can be disabled with a `-NAME` entry in `/etc/flatcar/enabled-sysext.conf`.

### Remove Docker and / or Containerd from Flatcar

If Flatcar is used as a Kubernetes node or one wants to try a different version of Docker or Containerd, it is possible to remove those extensions from Flatcar at boot using this configuration:
```yaml
variant: flatcar
version: 1.0.0
storage:
  links:
    - path: /etc/extensions/docker-flatcar.raw
      target: /dev/null
      overwrite: true
    - path: /etc/extensions/containerd-flatcar.raw
      target: /dev/null
      overwrite: true
```

## Community supported extensions ("community supported")

A simple way to extend Flatcar is to use the systemd-sysext images from the [sysext-bakery GitHub repo](https://github.com/flatcar/sysext-bakery). It [publishes prebuilt images](https://github.com/flatcar/sysext-bakery/releases) that bundle third-party binaries. The repo README provides a Butane config example for updating the extensions with `systemd-sysupdate`.

[Here's](https://flatcar.github.io/sysext-bakery/#what-extensions-are-available) a matrix for the community-supported extensions.

## Bundle extensions in a Flatcar image

The [`bake_flatcar_image.sh`](https://flatcar.github.io/sysext-bakery/#baking-sysexts-into-flatcar-os-images) helper in the [sysext-bakery GitHub repo](https://github.com/flatcar/sysext-bakery) can be used to customize a Flatcar release image by adding your extension images into the rootfs.

## The sysext format

Sysext images can be disk image files or simple folders (details in [`man systemd-sysext`](https://www.freedesktop.org/software/systemd/man/systemd-sysext.html)).
They get loaded by `systemd-sysext.service` which looks for them in `/etc/extensions/` or `/var/lib/extensions` among others.
An image must be named `NAME.raw` while a plain folder just uses `NAME` as name.
The image can be a plain ext4 or btrfs filesystem image but squashfs images are a useful format to consider because besides the compression it offers, the `mksquashfs` tool simply takes a directory as input and doesn't need loop devices and mounting of an image file.

Inside the image or folder structure there must be a file `usr/lib/extension-release.d/extension-release.NAME` with metadata used for version matching.
The basic matching that needs to be there is `ID=flatcar` plus one of `VERSION_ID` or `SYSEXT_LEVEL`.
If your binaries link against Flatcar's binaries under `/usr`, you must couple your sysext image to the Flatcar version by specyfing `VERSION_ID=MAJOR.MINOR.PATCH` in `extension-release.NAME` to match the `VERSION_ID` field from `/etc/os-release`.
This means that the sysext image won't be loaded anymore after an OS update.
Therefore, it is recommended that you try to use static binaries which lifts the requirement of having to couple the versions.
In this case you can specify `SYSEXT_LEVEL=1.0` instead of `VERSION_ID`.
The matching semantics for `SYSEXT_LEVEL` are limited at the moment and the use case for bumping the version are not there yet.
In summary, this is what you will normally write to the metadata file:

```
ID=flatcar
SYSEXT_LEVEL=1.0
```

Then place your binaries under `usr/bin/` and your systemd units under `usr/lib/systemd/system/`.
While Flatcar currently allows you to enable systemd units by including the symlinks it would generate when enabling the units, e.g., `sockets.target.wants/my.socket` → `../my.socket`, this is not recommended.
The recommended way is to ship drop-ins for the target units that start your unit, e.g., `usr/lib/systemd/system/sockets.target.d/10-docker-socket.conf` with the following content (similar for `multi-user.target` and a `.service` unit):

```ini
[Unit]
Upholds=docker.socket
```

## Supplying your sysext image from Ignition

The following Butane Config YAML can be be transpiled to Ignition JSON and will download a custom Docker+containerd sysext image on first boot.
It also takes care of disabling Torcx and future built-in Docker and containerd sysext images we plan to ship in Flatcar (to revert this, you can find the original target of the symlinks in `/usr/share/flatcar/etc/extensions/` - as said, this is not yet shipped).

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /etc/extensions/mydocker.raw
      mode: 0644
      contents:
        source: https://myserver.net/mydocker.raw
    - path: /etc/systemd/system-generators/torcx-generator
  links:
    - path: /etc/extensions/docker-flatcar.raw
      target: /dev/null
      overwrite: true
    - path: /etc/extensions/containerd-flatcar.raw
      target: /dev/null
      overwrite: true
```

After boot you can see it loaded in the output of the `systemd-sysext` command:

```
HIERARCHY EXTENSIONS SINCE
/opt      none       -
/usr      mydocker   Wed 2022-03-23 14:16:37 UTC
```

You can reload the sysext images at runtime by executing `systemctl restart systemd-sysext`.
In Flatcar this also triggers `ensure-sysext.service` to reload the unit files from disk (in the future this may be covered by `systemd-sysext` itself).
As an additional workaround, Flatcar currently also reevaluates `multi-user.target`, `sockets.target`, and `timers.target`, to make sure your enabled systemd units run, but for units started by `Upholds=` drop-ins that wouldn't be needed.
A manual `systemd-sysext refresh` is not recommended.

## Creating custom sysext images

The [`sysext-bakery`][sysext-bakery] repository under the Flatcar GitHub organization serves as a central point for sysext building tools.
Please reach out if your use case isn't covered and work with us to include it there.

### Upstream Docker sysext images

The Docker releases publish static binaries including containerd and the only missing piece are the systemd units.
To ease the process, the [`create_docker_sysext.sh`](https://raw.githubusercontent.com/flatcar/sysext-bakery/main/create_docker_sysext.sh) helper script takes care of downloading the release binaries and adding the systemd unit files, and creates a combined Docker+containerd sysext image:

```
./create_docker_sysext.sh 20.10.13 mydocker
[… writes mydocker.raw into current directory …]
```

## Converting a Torcx image

In case you have an existing Torcx image you can convert it with the [`convert_torcx_image.sh`](https://raw.githubusercontent.com/flatcar/sysext-bakery/main/convert_torcx_image.sh) helper script (Currently only Torcx tar balls are supported and the conversion is done on best effort):

```
./convert_torcx_image.sh TORCXTAR SYSEXTNAME
[… writes SYSEXTNAME.raw into the current directory …]
```

Please make also sure that your don't have a `containerd.service` drop in file under `/etc` that uses Torcx paths.

## Updating custom sysext images

From Flatcar 3510.2.0, it is possible to use the `systemd-sysupdate` tool that covers the task of downloading newer versions of your sysext image at runtime from a location you specify.

The [sysext-bakery documentation][sysext-bakery] has examples for Butane configs that consume the `sysext-bakery` images and keep them up-to-date with `systemd-sysupdate`. You can adapt the examples to other images of the `systemd-bakery` repo or to your custom images hosted elsewhere. An easy method is to fork the repo and tweak the list of released images to your liking.

## Debugging

The `systemd-dissect` tool gives a quick overview for a systemd-sysext image:

```
sudo systemd-dissect docker-compose.raw
```

You can list the contents of a systemd-sysext image with the `--list` flag (or `--mtree` for a detailed view):

```
sudo systemd-dissect --list docker-compose.raw
```

A single file can be extracted with:

```
sudo systemd-dissect --with docker-compose.raw cat usr/lib/extension-release.d/extension-release.docker-compose
```

To get more information about found incompatibilities during merging, enable the debug output:

```
sudo SYSTEMD_LOG_LEVEL=debug systemd-sysext refresh
```

[incusextension]: ../../container-runtimes/incus
[sysext-bakery]: https://flatcar.github.io/sysext-bakery
[nvidiaextension]: ../../setup/customization/using-nvidia
[zfsextension]: ../../setup/storage/zfs
