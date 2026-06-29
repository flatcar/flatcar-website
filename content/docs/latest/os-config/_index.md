---
title: OS Configuration
description: >
  Follow these guides to connect your machines together as a cluster.
  Configure machine parameters, create users, inject multiple SSH keys, and
  more with Butane configs.
weight: 30
aliases:
  - /docs/latest/setup/
  - /docs/latest/setup/customization/
---

# Flatcar OS Configuration

Source section: `os-config/` (renamed from `setup/` in the refactored branch, with security split out into its own `security/` section). Covers host configuration, networking, storage, and systemd.

## Host Configuration

| Topic | How |
|---|---|
| Adding users | Butane `passwd.users`; default user is `core` (wheel/sudo) |
| Date & timezone | `timedatectl set-timezone`; NTP via `systemd-timesyncd` |
| Kernel modules / sysctl | `/etc/modules-load.d/` and `/etc/sysctl.d/` |
| Drop-in units | `/etc/systemd/system/NAME.d/` override files |
| Environment variables | `EnvironmentFile=` or `Environment=` in unit files |
| Timers (cron replacement) | `.timer` + `.service` unit pairs |
| Power management | systemd power targets; TuneD profiles |
| NVIDIA GPUs | `nvidia-drivers-*` sysext (available since 4344.0.0) |

### Set update strategy with Butane

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /etc/flatcar/update.conf
      overwrite: true
      mode: 0420
      contents:
        inline: |
          REBOOT_STRATEGY=etcd-lock
```

## Networking

Flatcar uses `systemd-networkd` for all network configuration.

### Custom network config with Butane:

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /etc/systemd/network/10-static.network
      contents:
        inline: |
          [Match]
          Name=eth0
          [Network]
          Address=192.168.1.100/24
          Gateway=192.168.1.1
          DNS=8.8.8.8
```

| Topic | File / Tool |
|---|---|
| DNS | `/etc/systemd/resolved.conf` or `.network` `[Network]DNS=` |
| ACPI | `/etc/acpi/` custom tables (`os-config/network/ACPI.md`) |
| OverlayBD | Artifact streaming sysext (`overlaybd`, since 4426.0.0) |

## Storage

| Topic | Notes |
|---|---|
| RAID | Software RAID via `mdadm`; recommended for root filesystem |
| Adding disk space | Partition and format via Ignition or runtime `fdisk`/`mkfs` |
| Mounting storage | Systemd `.mount` units or `/etc/fstab` |
| iSCSI | `open-iscsi` included in base image |
| ZFS | Opt-in sysext (`zfs`) since 3913.0.0 |
| LVM | `lvm2` tools included |
| Swap | Swap file or partition via Butane `storage` section |

### RAID example using Butane

```yaml
variant: flatcar
version: 1.0.0
storage:
  raid:
    - name: md0
      level: raid1
      devices:
        - /dev/sdb
        - /dev/sdc
  filesystems:
    - device: /dev/md/md0
      format: ext4
      path: /var/lib/data
      wipe_filesystem: true
```

## systemd 

| Topic | How |
|---|---|
| Getting started | `systemctl` basics; `journalctl` for logs |
| Drop-in units | `systemctl edit SERVICE` or files in `.d/` directories |
| udev rules | `/etc/udev/rules.d/` — hardware event automation |
| User units | `~/.config/systemd/user/` for per-user services |
| systemctl | Full `systemctl` reference for Flatcar |


### Managing a Docker container as a systemd service:

```ini
[Unit]
Description=My Application
After=docker.service
Requires=docker.service

[Service]
ExecStartPre=-/usr/bin/docker rm --force myapp
ExecStart=/usr/bin/docker run --name myapp --rm myimage:latest
Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Place this in Butane under `systemd.units` with `enabled: true`.

