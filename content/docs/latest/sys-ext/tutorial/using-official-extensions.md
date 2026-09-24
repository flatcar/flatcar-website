---
title: "Part 2: Using Official Extensions"
linktitle: "2 — Using official extensions"
description: Enable, deploy, and verify official Flatcar release extensions and community bakery extensions.
weight: 20
---

## Official release extensions

Flatcar ships several opt-in release extensions. They are tested by the Flatcar team and downloaded from Flatcar's release servers at first boot.

### Enabling via `/etc/flatcar/enabled-sysext.conf`

The simplest way to enable an extension on an existing node is to write its name to `/etc/flatcar/enabled-sysext.conf` and reboot:

```bash
echo "podman" | sudo tee -a /etc/flatcar/enabled-sysext.conf
sudo reboot
```

### Enabling via Butane (recommended for new nodes)

For provisioning new nodes, declare the extensions in your Butane config:

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /etc/flatcar/enabled-sysext.conf
      mode: 0644
      contents:
        inline: |
          podman
          python
```

Transpile and pass to your VM or cloud instance as user data.

### Available release extensions

| Name in `enabled-sysext.conf` | Available since | Notes |
|-------------------------------|-----------------|-------|
| `podman` | 3941.0.0 | Rootless container runtime |
| `python` | 4012.0.0 | Python 3 interpreter |
| `zfs` | 3913.0.0 | ZFS filesystem support |
| `incus` | 4285.0.0 | Incus container/VM manager |
| `nvidia-drivers-*` | 4344.0.0 | NVIDIA GPU drivers |
| `overlaybd` | 4426.0.0 | Overlaybd image streaming |

### Opting out of built-in extensions

Docker and containerd are **enabled by default**. To disable them — for example on a Kubernetes node that uses containerd from a sysext-bakery image instead — use null symlinks:

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

## Community extensions (sysext-bakery)

For tools not in the official list, [sysext-bakery](https://github.com/flatcar/sysext-bakery) publishes pre-built images covering Kubernetes, Tailscale, Vault, k3s, Cilium, and more.

### One-off download via Butane

This example provisions the latest `tailscale` bakery extension at first boot:

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /etc/extensions/tailscale.raw
      mode: 0644
      contents:
        source: https://extensions.flatcar.org/tailscale.raw
```

### With auto-updates via systemd-sysupdate

The sysext-bakery repository publishes a `sysupdate` configuration for each extension so `systemd-sysupdate` can keep them up to date automatically. The [sysext-bakery documentation](https://flatcar.github.io/sysext-bakery/) has complete Butane config examples.

## Verifying extension status

Once the node is running, check which extensions are active:

```bash
systemd-sysext status
```

Expected output when extensions are merged:

```
HIERARCHY EXTENSIONS     SINCE
/opt      none           -
/usr      podman, python Thu 2026-01-01 10:00:00 UTC
```

Check that the extension's binaries are in `PATH`:

```bash
which podman
# /usr/bin/podman

podman --version
# podman version 5.x.y
```

If an extension is listed in the status output but binaries are missing, run:

```bash
sudo SYSTEMD_LOG_LEVEL=debug systemd-sysext refresh
```

to see detailed merge diagnostics.

## Reloading extensions at runtime

```bash
sudo systemctl restart systemd-sysext
```

This unmounts all extension overlays and re-merges them. In Flatcar, this also triggers `ensure-sysext.service`, which reloads systemd unit files from disk so newly added service units become available immediately.

## Next

[Part 3 — Building your first custom extension →](../building-custom-extension/)
