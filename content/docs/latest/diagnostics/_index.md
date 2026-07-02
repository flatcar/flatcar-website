---
title: Flatcar Diagnostics
description: >
  Useful tools and techniques to understand what's going on inside a
  Flatcar instance when things don't work as expected.
weight: 70
aliases:
  - /docs/latest/setup/debug/
---

# Flatcar Diagnostics

You can use the following tools and resources to understand what’s going on inside in a Flatcar instance and troubleshoot as needed.

Access logs:
- Crash logs with `pstor`, see [Collecting crash logs on Flatcar Container](./collecting-crash-logs.md).
- System logs with `journalctl`, see [Reading the system log](./reading-the-system-log.md).

Debug and troubleshoot:
- Use `toolbox`, see [Debugging tools on Flatcar Container Linux](./install-debugging-tools.md).
- Use `btrfs`, see [Tips and tricks for solving issues related to btrfs on Flatcar](./btrfs-troubleshooting.md).

Rollbacks:
- Manual or automated, see [Flatcar container rollbacks](./manual-rollbacks.md).

## Common Diagnostic Patterns

| Problem | Command |
|---|---|
| Unit won't start | `journalctl -u SERVICE --no-pager` |
| Network issues | `networkctl status`, `resolvectl status` |
| Container issues | `docker logs CONTAINER`, `journalctl CONTAINER_ID` |
| Boot issues | `journalctl -b -1` (previous boot) |
| Ignition didn't run | Check `/var/log/ignition.log`; verify `flatcar/first_boot` flag was present |
| Update stuck | `update_engine_client -status`; `journalctl -u update-engine` |

