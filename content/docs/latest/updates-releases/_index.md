---
content_type: nebraska
title: Nebraska Update Manager & Releases
main_menu: true
weight: 80
cascade:
  github_edit_url: https://github.com/flatcar/flatcar-website/tree/master/content/docs/latest
  issues_url: https://github.com/flatcar/nebraska/issues/new
aliases:
  - /docs/latest/nebraska/
---

# Flatcar Nebraska Updates & Releases

Nebraska is an update manager for Flatcar Container Linux. It offers an easy way to monitor and manage the rollout of updates to applications that use the Omaha protocol, with special functionality for Flatcar Container Linux updates.

Source section: `updates-releases/` (consolidates `nebraska/` and `setup/releases/` from the main branch into one section in the refactored branch).

## Release Channels

| Channel | Cadence | Purpose |
|---|---|---|
| Alpha | Frequent | Latest features, cutting edge |
| Beta | ~2 months | Release candidates; no known issues |
| Stable | ~2 months | Production-ready |
| LTS | 12 months | 18-month security support (commercial) |

### Switching channels via Butane

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /etc/flatcar/update.conf
      overwrite: true
      mode: 0644
      contents:
        inline: |
          GROUP=beta
          SERVER=https://public.update.flatcar-linux.net/v1/update/
```

## Update Flow

1. `update-engine.service` downloads update to the **inactive** USR partition (background)
2. Reboot manager coordinates when the node reboots
3. GRUB boots into the updated partition
4. On boot failure, automatic rollback to the previous partition

### Update engine status values

`IDLE` → `CHECKING_FOR_UPDATE` → `UPDATE_AVAILABLE` → `DOWNLOADING` → `VERIFYING` → `FINALIZING` → `UPDATED_NEED_REBOOT`

Force an immediate update check:

```sh
update_engine_client -update
```

## Reboot Strategies

| Strategy | Behavior |
|---|---|
| `reboot` (default) | Reboot 5 minutes after update is applied |
| `etcd-lock` | Acquire distributed etcd lock first |
| `off` | Never reboot automatically |

### Reboot manager options

- `locksmithd` — default, included in image
- **FLUO** ([flatcar-linux-update-operator](https://github.com/flatcar/flatcar-linux-update-operator)) — recommended for Kubernetes; understands node draining
- **Kured** — supported from Flatcar >3067.0.0

### Reboot window example (locksmithd)

```yaml
storage:
  files:
    - path: /etc/flatcar/update.conf
      contents:
        inline: |
          REBOOT_STRATEGY=reboot
          LOCKSMITHD_REBOOT_WINDOW_START=02:00
          LOCKSMITHD_REBOOT_WINDOW_LENGTH=1h
```

## update.conf

Key fields in `/etc/flatcar/update.conf`:

| Field | Purpose |
|---|---|
| `SERVER` | Update server URL |
| `GROUP` | Channel name or Nebraska group UUID |
| `REBOOT_STRATEGY` | Reboot coordination strategy |
| `MACHINE_ALIAS` | Display name in Nebraska dashboard |

## Verifying Images

Flatcar images are GPG-signed. Verify before use:

```sh
gpg --verify flatcar_production_image.vmlinuz.sig
```

## Nebraska Update Manager

Nebraska is a self-hosted Omaha-protocol update server for Flatcar. It gives operators control over which nodes update, when, and at what rate.

What Nebraska provides:

- Dashboard to monitor instance update status
- Instance groups with configurable channels (alpha/beta/stable or custom UUIDs)
- Rollout rate control and time windows
- Machine alias display
- OEM extension payload serving (required since Flatcar 3760.0.0)

### Pointing new machines at Nebraska (Butane)

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /etc/flatcar/update.conf
      overwrite: true
      mode: 0644
      contents:
        inline: |
          GROUP=stable
          SERVER=http://your.nebraska.host:8000/v1/update/
```

### Custom Nebraska group

```
GROUP=ab51a000-02dc-4fc7-a6b0-c42881c89856
SERVER=http://your.nebraska.host:8000/v1/update/
```

### Existing machines

```sh
# Edit /etc/flatcar/update.conf
echo "SERVER=http://your.nebraska.host:8000/v1/update/" >> /etc/flatcar/update.conf
update_engine_client -update
```

Nebraska is open source: https://github.com/flatcar/nebraska  
Default sample port: 8000, plain HTTP — configure TLS for production.

### OEM payloads

Self-hosted Nebraska must serve OEM sysext payloads (introduced in Flatcar 3760.0.0). Keep Nebraska up to date.

