---
title: "Part 3: Building Your First Custom Extension"
linktitle: "3 — Building a custom extension"
description: Step-by-step guide to packaging a static binary into a sysext image from scratch.
weight: 30
---

This part walks through building a custom sysext image that ships `jq` — a lightweight, statically-linked JSON processor. The same steps apply to any static binary.

## Prerequisites

You need the following tools on your **local machine** (not inside Flatcar):

```bash
# Debian/Ubuntu
sudo apt install squashfs-tools curl

# macOS (via Homebrew)
brew install squashfs
```

## Step 1 — Create the sysext directory structure

A sysext image is just a directory (or filesystem image) with a specific layout:

```
my-jq.raw  (squashfs image of the directory below)
└── usr/
    ├── bin/
    │   └── jq                          ← the binary
    └── lib/
        └── extension-release.d/
            └── extension-release.my-jq ← required metadata file
```

Create the directory structure:

```bash
mkdir -p my-jq/usr/bin
mkdir -p my-jq/usr/lib/extension-release.d
```

## Step 2 — Download the static binary

Download the `jq` static binary for `x86-64`:

```bash
curl -fsSL -o my-jq/usr/bin/jq \
  https://github.com/jqlang/jq/releases/latest/download/jq-linux-amd64

chmod +x my-jq/usr/bin/jq
```

For `arm64`:

```bash
curl -fsSL -o my-jq/usr/bin/jq \
  https://github.com/jqlang/jq/releases/latest/download/jq-linux-arm64

chmod +x my-jq/usr/bin/jq
```

> **Important:** Never place binaries in `usr/sbin/`. On Flatcar, `/usr/sbin` is a symlink to `/usr/bin`. Shipping a `usr/sbin/` directory in a sysext would overwrite that symlink and break the host. Always use `usr/bin/`.

## Step 3 — Write the extension-release metadata file

This file tells `systemd-sysext` that the extension is compatible with Flatcar. The name of the file must match the extension name exactly.

```bash
cat > my-jq/usr/lib/extension-release.d/extension-release.my-jq << 'EOF'
ID=flatcar
SYSEXT_LEVEL=1.0
EOF
```

`SYSEXT_LEVEL=1.0` means the extension works with any Flatcar version — the right choice for static binaries that have no OS-level dependencies.

If your binary links against Flatcar's glibc or other OS libraries, use `VERSION_ID` instead:

```ini
ID=flatcar
VERSION_ID=3975.2.0
```

This couples the extension to that specific Flatcar release. The extension will stop loading after an OS update, so always prefer static binaries when possible.

## Step 4 — Build the squashfs image

```bash
mksquashfs my-jq my-jq.raw
```

You now have `my-jq.raw` — a squashfs sysext image ready to be loaded on Flatcar.

Verify it looks correct:

```bash
# List contents
sudo systemd-dissect --list my-jq.raw

# Check the extension-release metadata
sudo systemd-dissect --with my-jq.raw \
  cat usr/lib/extension-release.d/extension-release.my-jq
```

Expected output of the metadata check:

```
ID=flatcar
SYSEXT_LEVEL=1.0
```

## Adding a systemd service (optional)

If your extension ships a daemon, add its unit file under `usr/lib/systemd/system/`:

```bash
mkdir -p my-service/usr/lib/systemd/system/multi-user.target.d

# The service unit
cat > my-service/usr/lib/systemd/system/my-service.service << 'EOF'
[Unit]
Description=My custom service

[Service]
ExecStart=/usr/bin/my-service --config /etc/my-service/config.yaml
Restart=on-failure
EOF

# Drop-in to start it automatically on merge
# (do NOT use symlinks — use Upholds= drop-ins instead)
cat > my-service/usr/lib/systemd/system/multi-user.target.d/10-my-service.conf << 'EOF'
[Unit]
Upholds=my-service.service
EOF
```

> **Why `Upholds=` and not a symlink?** Flatcar recommends using `Upholds=` drop-ins rather than shipping `WantedBy` symlinks inside the sysext. Drop-ins are the safe, supported approach; symlinks in sysexts can cause unit activation to fail in subtle ways.

## Recap: what you built

```
my-jq.raw
├── usr/bin/jq                                     ← static binary
└── usr/lib/extension-release.d/extension-release.my-jq
                                                   ← SYSEXT_LEVEL=1.0
```

In [Part 4](../testing-locally/) you will load this image into a live Flatcar QEMU VM and verify it works.

## Next

[Part 4 — Testing locally →](../testing-locally/)
