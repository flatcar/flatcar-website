---
title: Managing swap space Flatcar Container Linux
linktitle: Managing swap space
description: How to create swapfiles, turn swap on/off, tune swap parameters and debug swap issues.
weight: 40
aliases:
    - ../../os/adding-swap
    - ../../clusters/management/adding-swap
---

Swap is the process of moving pages of memory to a designated part of the hard disk, freeing up space when needed. Swap can be used to alleviate problems with low-memory environments.
A modern alternative to slow swap partitions is to use RAM compression with zram.

By default Flatcar Container Linux does not include a partition for swap nor a zram configuration, however one can configure their system to have swap, either by including a dedicated partition for it, creating a swapfile, or setting up zram.

## Using zram

With zram a virtual `/dev/zram0` device acts as swap space which lives compressed in memory.
One can activate zram by creating a `[zram0]` section in `/etc/systemd/zram-generator.conf`.
Here are Butane config (YAML) that creates the file:

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /etc/systemd/zram-generator.conf
      contents:
        inline: |
          [zram0]
```

You can tweak the size by using the minimum of either 8 GB if one has a lot of RAM or the size of the RAM, e.g., 1 GB, by setting `zram-size`:

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /etc/systemd/zram-generator.conf
      contents:
        inline: |
          [zram0]
          zram-size = min(ram, 8192)
```

Allocating a compressed RAM section that can hold an amount up to the size of the RAM itself works well because most RAM contents compress very well.

After a reboot you can check the results:

```shell
$ zramctl
NAME       ALGORITHM DISKSIZE DATA COMPR TOTAL STREAMS MOUNTPOINT
/dev/zram0 lzo-rle         1G   4K   74B   12K       8 [SWAP]
```

## Managing swap with systemd

systemd provides a specialized `.swap` unit file type which may be used to activate swap. The below example shows how to add a swapfile and activate it using systemd.

### Creating a swapfile

The following commands, run as root, will make a 1GiB file suitable for use as swap.

> From Flatcar 4186, one can directly use mkswap to create a swap file as follow. For older Flatcar versions, you still need to create a swap file with `dd if=/dev/zero of=/var/vm/swapfile1`, `chmod 600 /var/vm/swapfile1` and `mkswap /var/vm/swapfile1`


```shell
mkdir -p /var/vm
mkswap --size 1024m --file /var/vm/swapfile1
```

### Creating the systemd unit file

The following systemd unit activates the swapfile we created. It should be written to `/etc/systemd/system/var-vm-swapfile1.swap`.

```ini
[Unit]
Description=Turn on swap

[Swap]
What=/var/vm/swapfile1

[Install]
WantedBy=multi-user.target
```

### Enable the unit and start using swap

Use `systemctl` to enable the unit once created. The `swappiness` value may be modified if desired.

```shell
$ systemctl enable --now var-vm-swapfile1.swap
# Optionally
$ echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/80-swappiness.conf
$ systemctl restart systemd-sysctl
```

Swap has been enabled and will be started automatically on subsequent reboots. We can verify that the swap is activated by running `swapon`:

```shell
$ swapon
NAME              TYPE       SIZE USED PRIO
/var/vm/swapfile1 file      1024M   0B   -1
```

## Problems and Considerations

### Btrfs and xfs

Please check the [btrfs instructions](https://btrfs.readthedocs.io/en/latest/btrfs-man5.html#swapfile-support) on how to create swapfiles on btrfs.
In summary, you must use a single device filesystem, make sure you create the file on a non-snapshotted subvolume
(e.g., to make sure this is the case you can create a new subvolume for the file), create the file with `truncate -s 0 ./swapfile1`
and then disable CoW and compression (`chattr +C ./swapfile1`, `btrfs property set ./swapfile1 compression none`).

Swapfiles should not be created on xfs volumes.  For systems using xfs, it is recommended to create a dedicated swap partition.

### Partition size

The swapfile cannot be larger than the partition on which it is stored.

### Checking if a system can use a swapfile

Use the `df(1)` command to verify that a partition has the right format and enough available space:

```shell
$ df -Th
Filesystem     Type      Size  Used Avail Use% Mounted on
[...]
/dev/sdXN      ext4      2.0G  3.0M  1.8G   1% /var
```

The block device mounted at `/var/`, `/dev/sdXN`, is the correct filesystem type and has enough space for a 1GiB swapfile.

## Adding swap with a Butane Config

The following config sets up a 1GiB swapfile located at `/var/vm/swapfile1`.

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
  - path: /etc/sysctl.d/80-swappiness.conf
    contents:
      inline: "vm.swappiness=10"

systemd:
  units:
    - name: var-vm-swapfile1.swap
      enabled: true
      contents: |
        [Unit]
        Description=Turn on swap
        Requires=create-swapfile.service
        After=create-swapfile.service

        [Swap]
        What=/var/vm/swapfile1

        [Install]
        WantedBy=multi-user.target
    - name: create-swapfile.service
      contents: |
        [Unit]
        Description=Create a swapfile
        RequiresMountsFor=/var
        DefaultDependencies=no

        [Service]
        Type=oneshot
        ExecStart=/usr/bin/mkdir -p /var/vm
        ExecStart=/usr/bin/mkswap --size 1024m --file /var/vm/swapfile1
        RemainAfterExit=true
```

## Using a dedicated swap disk

The following Butane config sets up `/dev/sdb` to be used as swap:

```yaml
variant: flatcar
version: 1.0.0
storage:
  disks: 
    - device: /dev/sdb 
      wipe_table: true 
      partitions: 
        - label: swap
          type_guid: 0657FD6D-A4AB-43C4-84E5-0933C84B4F4F
  filesystems:
    - device: /dev/disk/by-partlabel/swap
      format: swap
      wipe_filesystem: true
      label: swap
      with_mount_unit: true
```

NB the systemd unit name is created by
`systemd-escape -p /dev/disk/by-partlabel/swap` as systemd uses - as the
path separator meaning that paths containing - have to be escaped. This
leads to a file `'dev-disk-by\x2dpartlabel-swap.swap'` being created in
`/etc/systemd/system`.
