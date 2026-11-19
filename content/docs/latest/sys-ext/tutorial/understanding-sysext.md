---
title: "Part 1: Understanding systemd-sysext"
linktitle: "1 — Understanding sysext"
description: What systemd-sysext is, why Flatcar uses it, and how the three extension types differ.
weight: 10
---

## What is systemd-sysext?

Flatcar's root filesystem is **read-only**. You cannot install packages with `apt` or `yum` — there is no package manager. This is intentional: it keeps the OS minimal, reproducible, and easy to update atomically.

`systemd-sysext` is how you layer **additional software on top of that read-only base** without modifying it. It works by mounting an overlay over `/usr` at boot time. Any binaries, libraries, or systemd unit files inside the extension image become available on the running system as if they were part of the OS.

When `systemd-sysext` merges an extension image, the result looks like this:

```
/usr  ←─── read-only base OS
  └── overlay ←─── your extension image
        └── bin/kubectl   (now visible at /usr/bin/kubectl)
        └── lib/systemd/system/kubelet.service
```

After a reboot (or `systemctl restart systemd-sysext`), the overlay is gone. The base OS is untouched.

## Why Flatcar uses sysext

Before sysext, the only supported way to run extra binaries on Flatcar was to place them in `/opt/bin` and adjust `$PATH`. That worked but was fragile, hard to version, and not integrated with systemd.

sysext solves all of that:

- Extensions are versioned, signed, and verified
- Binaries land directly in `/usr/bin` — no `$PATH` tricks
- systemd unit files are picked up automatically
- `systemd-sysupdate` can update extensions in the background, just like OS updates

Flatcar has supported user-provided sysext images since version **3185.0.0**.

## The three extension types

This is the most common source of confusion. Flatcar ships three distinct categories of extension, and they work differently.

### Built-in (always present)

These are shipped as part of every Flatcar image and are **always active**. You cannot disable them without explicitly opting out via Ignition.

Examples: `docker-flatcar`, `containerd-flatcar`, OEM-specific extensions (`oem-*`).

To opt out of a built-in extension, create a symlink to `/dev/null` via Butane:

```yaml
variant: flatcar
version: 1.0.0
storage:
  links:
    - path: /etc/extensions/docker-flatcar.raw
      target: /dev/null
      overwrite: true
```

### Official / release extensions (opt-in)

These are built and tested by the Flatcar team but are **not active by default**. They are downloaded from Flatcar's release servers at first boot when enabled.

To enable one, add its name to `/etc/flatcar/enabled-sysext.conf`:

```ini
podman
zfs
python
```

Or via Butane:

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /etc/flatcar/enabled-sysext.conf
      contents:
        inline: |
          podman
          zfs
```

See the [system extensions reference page](../../) for the full list of available release extensions.

### Community extensions (sysext-bakery)

These are built and published by the community via [sysext-bakery](https://github.com/flatcar/sysext-bakery). They are **not tested in Flatcar's CI** but cover a wide range of tools: Kubernetes, Tailscale, Vault, k3s, Cilium, and many more.

You download them yourself and provision them via Ignition. See [Part 5 — Production deployment](../production-deployment/) for examples.

## How the overlay works

When `systemd-sysext.service` starts, it scans `/etc/extensions/` and `/var/lib/extensions/` for `.raw` image files and directories. It then mounts them as overlay layers over `/usr`.

For an extension to be accepted, it must contain a **metadata file** at:

```
usr/lib/extension-release.d/extension-release.<NAME>
```

This file tells `systemd-sysext` what OS version and architecture the extension is compatible with. The minimum required content is:

```ini
ID=flatcar
SYSEXT_LEVEL=1.0
```

If your extension links against Flatcar's own libraries (dynamically linked binaries), you must pin it to a specific Flatcar version:

```ini
ID=flatcar
VERSION_ID=3975.2.0
```

This means the extension stops loading after an OS update — the extension must be rebuilt for the new Flatcar version. **This is why static binaries are strongly preferred**: with static binaries you use `SYSEXT_LEVEL=1.0` and the extension loads regardless of the Flatcar version.

## Next

[Part 2 — Using official extensions →](../using-official-extensions/)
