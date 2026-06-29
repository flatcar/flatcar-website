---
title: Diagnostics and Fixing Issues
description: >
  Useful tools and techniques to understand what's going on inside a
  Flatcar instance when things don't work as expected.
weight: 70
aliases:
  - /docs/latest/setup/debug/
---

# Flatcar Diagnostics

Source section: `diagnostics/` (renamed from `setup/debug/` in the refactored branch).

## Installing Debugging Tools

The Flatcar base image deliberately omits general-purpose debugging utilities to keep the footprint minimal. Use `toolbox` to access them:

```sh
toolbox
```

`toolbox` drops you into a Fedora container with the host filesystem accessible at `/media/root`. You get `strace`, `gdb`, `tcpdump`, package management, and other tools without modifying the base OS.

Inside toolbox:

```sh
# Access host filesystem
ls /media/root/etc
# Run a host binary
chroot /media/root /usr/bin/some-tool
```

## Reading the System Log

```sh
# All logs from current boot
journalctl -b

# Logs for a specific unit
journalctl -u docker.service

# Follow live
journalctl -f

# Kernel messages only
journalctl -k
```

Persistent logs are stored in `/var/log/journal/` if the directory exists (created by default on Flatcar).

## Collecting Crash Logs

Core dumps and crash logs go to `/var/log/crash/`. Configure `systemd-coredump` for structured core dump capture:

```sh
# Check for recent coredumps
coredumpctl list
coredumpctl info PID
```

## btrfs troubleshooting

Flatcar uses btrfs as the default root filesystem format.

```sh
# Check filesystem health
sudo btrfs check /dev/sda9

# Scrub (background integrity check)
sudo btrfs scrub start /
sudo btrfs scrub status /

# Show disk usage
sudo btrfs filesystem df /
sudo btrfs filesystem usage /
```

## Manual Rollbacks

If an update causes problems, roll back to the inactive (previous) partition:

```sh
# Show partition priorities
cgpt show /dev/sda

# Prioritize the inactive USR partition (find which is inactive first)
cgpt prioritize -P 1 -i PARTITION_NUMBER /dev/sda

# Reboot into the previous version
sudo systemctl reboot
```

Alternatively, interrupt GRUB at boot and manually select the previous USR partition.

Automatic rollback occurs if the boot fails — GRUB tries the other partition automatically.

## Common Diagnostic Patterns

| Problem | Command |
|---|---|
| Unit won't start | `journalctl -u SERVICE --no-pager` |
| Network issues | `networkctl status`, `resolvectl status` |
| Container issues | `docker logs CONTAINER`, `journalctl CONTAINER_ID` |
| Boot issues | `journalctl -b -1` (previous boot) |
| Ignition didn't run | Check `/var/log/ignition.log`; verify `flatcar/first_boot` flag was present |
| Update stuck | `update_engine_client -status`; `journalctl -u update-engine` |

