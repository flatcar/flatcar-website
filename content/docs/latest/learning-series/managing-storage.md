---
title: "Flatcar Self-Paced Learning Series: Managing Storage"
linktitle: Managing Storage
weight: 3
author: Lexi Nadolski, Thilo Fromm
---

This session discusses handling additional storage, and customising the file system type used for the root filesystem.
We will also provision encrypted storage to tighten security.

## A note for infrastructure developers

All configuration included in this course can also be generated programmatically.
[Ignition](https://github.com/coreos/ignition) provides Go bindings for all Butane options used.

# Goals

In this session, you'll learn:
- Adding additional storage to your local QEmu set-up.
- Configuring and customising the new storage device via Butane.
- Encrypting data storage with LUKS.
- Encrypting the root FS.

## Prerequisites

The session builds on the session "Advanced Service Configuration".
We will re-use and extend on the Butane configuration from that session.

# MOAR space: Storage devices and file systems

## Adding a file-backed storage device

What about services that need lots of storage?
That data shouldn't reside on the OS disk.
For handling storage devices, Butane offers disk customisation options for partitioning, formatting, and even encrypting disks.

To emulate an additional disk in our local QEmu test environment, we'll create a "disk" file on the host.
We'll later pass this to qemu which will present it as an actual disk to the Flatcar VM guest OS.

```sh
qemu-img create -f qcow2 mydisk 1G
```

While 1 Gigabyte seems to be a lot just for testing, worry not.
The `qcow2` format (**Q**emu **c**opy **o**n **w**rite) won't take much space on your system unless we commit data to it from inside the VM.
Which we'll never do since we run in `-snapshot` mode.

Lastly, we want to tell qemu about the file-backed new storage device when we start the VM.
We can pass plain qemu options in our VM start wrapper script (and we already did, with `-snapshot` and `-nographic`); we'll add

```sh
-drive file=mydisk,driver=qcow2,snapshot=on,media=disk,if=virtio
```

to the command line.

<details>
<summary>Dissecting the qemu -drive option</summary>

* `-drive` defines a new virtual drive to be presented to the VM.
  It's a shorthand version of `-blockdev` (for the host / emulator side) and `-disk` (for the VM presentation side) which would allow more thorough customisation.
* `file=mydisk` the file name of the file backing the device on the host's filesystem.
* `driver=qcow2` the file on the host is in `qcow2` format.
* `snapshot=on` don't write anything, just like we do with the OS disk.
* `media=disk` can be disk or CDROM; we want disk.
* `if=virtio` the guest will access this device using the `virtio` driver.
  `virtio` is a very efficient, low-overhead, zero-copy driver framework for VM - host communication.

</details>

<br />

To briefly verify we can launch Flatcar without any configuration:
```sh
./flatcar_production_qemu_uefi.sh -snapshot -nographic -drive file=mydisk,driver=qcow2,snapshot=on,media=disk,if=virtio
```

A brief glance on `/proc/partitions` should list (among others) a `vdb` disk w/o any partitions:
```sh
cat /proc/partitions
```

## Configuring and using the storage device

Now we want to express in our Butane config what to do with the additional storage.
Since we'll be using qemu's `virtio` driver for both the OS disk as well as our additional storage, and we know the OS disk is `/dev/vda`, we can predict the second disk to be `/dev/vdb`.
More advanced configuration could rely on the disk's serial number or UUID instead of volatile disk names.

We're already telling Ignition to download to `/srv/www/html`, which is also volume-mounted into the Caddy container.
So we should provide our additional storage at `/srv`.

For starters, let's add a new `disks.json` Ignition config to our main YAML file:

```yaml
variant: flatcar
version: 1.0.0

passwd:
  users:
    - name: webby
      uid: 1234
      no_create_home: true
      groups: [ docker ]

ignition:
  config:
    merge:
      - local: disks.json
      - local: files.json
      - local: systemd.json
```

In the corresponding `disks.yaml` Butane, we'll create a partition that spans the whole disk.
We'll create a `btrfs` filesystem on that partition and mount it to `/srv`:
```yaml
variant: flatcar
version: 1.0.0

storage:
  disks:
    - device: /dev/vdb
      partitions:
        - label: mydata
  filesystems:
    - device: /dev/disk/by-partlabel/mydata
      format: btrfs
      path: /srv
      with_mount_unit: true
```

Let's transpile.
We need to add the new `disks` YAML file to our transpile loop:
```sh
for f in disks files systemd main; do
  cat $f.yaml | docker run --rm -v "$(pwd):/files" -i quay.io/coreos/butane:latest --files-dir /files > $f.json
done
```

Let's run it!
```sh
./flatcar_production_qemu_uefi.sh -i disks.json -f 12345:80 -- -snapshot -nographic -drive file=mydisk,driver=qcow2,snapshot=on,media=disk,if=virtio
```

Check out if it worked:
```sh
mount | grep srv
df -h /srv
```

should show `vdb1` (the first partition of the second `virtio` disk) mounted on `/srv` using the `btrfs` filesystem, with roughly 1GB of total space.

# Encrypting storage

We can further secure our workload by transparently encrypting its data.
Storage encryption using LUKS (**L**inux **U**nified **K**ey **S**etup) is a straightforward way to do this.

Instead of using the `mydata` partition we created in the previous step directly, we'll pass it to LUKS.
We will then create our `btrfs` filesystem on the LUKS device instead of the plain partition.

This tiny snippet handles all that:

```yaml
...
  luks:
    - device: /dev/disk/by-partlabel/mydata
      label: mydata
      name: mydata-encrypted
  filesystems:
    - device: /dev/mapper/mydata-encrypted
...
```

Ignition will auto-generate a strong encryption key and store it securely in `/etc/luks/mydata-encrypted`, in accordance with the LUKS partition name.

<details>
<summary>Full disks.yaml config for convenience</summary>

```yaml
variant: flatcar
version: 1.0.0

storage:
  disks:
    - device: /dev/vdb
      partitions:
        - label: mydata
  luks:
    - device: /dev/disk/by-partlabel/mydata
      label: mydata
      name: mydata-encrypted
  filesystems:
    - device: /dev/mapper/mydata-encrypted
      format: btrfs
      path: /srv
      with_mount_unit: true
```

</details>

<br />

Don't forget to transpile!

As previously, we need to pass the additional file-backed disk when running the deployment.
Since we use snapshot mode for the disk, the partition and file system we generated at the previous boot will be gone.

```sh
./flatcar_production_qemu_uefi.sh -i disks.json -f 12345:80 -- -snapshot -nographic -drive file=mydisk,driver=qcow2,snapshot=on,media=disk,if=virtio
```

You'll note a considerably longer boot time; this is when the LUKS device is set up.
It should take between 10 and 20 seconds, depending on your host system.

After we've booted, check out the new set-up:
```sh
mount | grep srv
sudo dmsetup table mydata-encrypted
sudo cryptsetup luksDump /dev/disk/by-partlabel/mydata
```

Nice work! Our data is safe now.

## Encrypting the root filesystem

<table style="background-color:#fef;"><tr><td><span style="font-size:xxx-large;">⚠️</span></td><td>
<h3>The Below is for Learning Purposes ONLY.</h3>

The root partition encryption key will be inaccessible at second boot; the VM will stop booting in the initrd stage and prompt for a password via the serial console.
While that's fine for demonstration purposes, it's not recommended for production environments.
For large-scale deployments you would want to store the key someplace safe where it can be retrieved automatically, e.g. in a TPM.
After working through the section below to understand encryption basics,
check out our documentation on [setting up a TPM backed encrypted root FS](./../setup/security/luks) for a TPM deep dive.

</td></tr></table>

<br />

A major benefit of Flatcar's Ignition configuration over alternatives like cloud-init is that it runs *very* early at boot.
Consider the following generic boot process:

1. BIOS / UEFI: starts...
2. Grub (bootloader). Loads and starts...
3. Kernel and init-ramdisk (all in-memory) run. Initial system set-up, then
4. root FS check and mount
5. Other FS checks and mounts
6. Services start

Ignition runs at step #3, while cloud-init (on cloud-init based systems) would run as a regular service at step #6.
Apart from defining and customising services to run at step #6, we can also make drastic modifications to the root filesystem.
Like, re-formatting and encrypting it.

Consider the following snippet:
```
storage:
  ...
  luks:
  ...
    - name: rootencrypted
      wipe_volume: true
      device: "/dev/disk/by-partlabel/ROOT"
  ...
  filesystems:
  ...
    - device: /dev/mapper/rootencrypted
      format: ext4
      label: ROOT
...
```

Once again, Ignition will auto-generate a key in `/etc/luks/rootencrypted`.

<details>
<summary>Full disks.yaml config for convenience</summary>

```yaml
variant: flatcar
version: 1.0.0

storage:
  disks:
    - device: /dev/vdb
      partitions:
        - label: mydata
  luks:
    - device: /dev/disk/by-partlabel/mydata
      label: mydata
      name: mydata-encrypted
    - name: rootencrypted
      wipe_volume: true
      device: "/dev/disk/by-partlabel/ROOT"
  filesystems:
    - device: /dev/mapper/rootencrypted
      format: ext4
      label: ROOT
    - device: /dev/mapper/mydata-encrypted
      format: btrfs
      path: /srv
      with_mount_unit: true
```

</details>

Don't forget to transpile!

After we've booted, check `/dev/vda9`, our root partition:

```sh
mount | grep srv
sudo dmsetup table rootencrypted
sudo cryptsetup luksDump /dev/vda9
```

**NOTE**: While the root partition is automatically unlocked at first boot (because the LUKS key has been set), it will require **manually entering a passphrase** on subsequent boots.
This is usually done via the serial console.
The VM will stop booting and prompt for the passphrase.
Since we only set a key so far, we should set a passphrase immediately after first boot.
The key is stored in LUKS slot 0; we'll use slot 1 for our passphrase:

```sh
sudo cryptsetup --key-slot 1 -d /etc/luks/rootencrypted luksAddKey /dev/vda9
```

The command will prompt for a passphrase, then prompt again to verify.
Type in a passphrase and remember it well!
You can then use `luksDump` again to check if a new key is now in slot 1.

```sh
sudo cryptsetup luksDump /dev/vda9
```

Reboot the VM to verify the passphrase works:

```
sudo reboot
```

The VM will stop booting at the initrd stage and prompt for your passphrase.


### Done!

In this session, you learned to:

- Add and customise additional storage devices for your node.
- Encrypt storage devices to secure your data.
- Encrypt your root file system.
