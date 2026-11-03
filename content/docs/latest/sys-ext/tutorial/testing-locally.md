---
title: "Part 4: Testing Locally"
linktitle: "4 — Testing locally"
description: Boot a Flatcar QEMU VM, load your custom extension, and debug merge failures.
weight: 40
---

This part shows how to test the `my-jq.raw` image you built in [Part 3](../building-custom-extension/) using a local Flatcar QEMU VM before deploying to production.

## Prerequisites

- `my-jq.raw` in your current directory
- `qemu` installed (`qemu-system-x86_64` or `qemu-system-aarch64`)
- `docker` installed and running (used by the `bakery.sh boot` helper)

## Option A — Using bakery.sh boot (easiest)

If you have [sysext-bakery](https://github.com/flatcar/sysext-bakery) cloned locally, the `boot` command handles everything — image download, HTTP server, and VM launch — in one step:

```bash
./bakery.sh boot my-jq.raw
```

This will:
1. Download the latest Flatcar Alpha QEMU image (if not already present)
2. Start a local HTTP server serving `my-jq.raw`
3. Generate a Butane config that provisions the extension from `http://10.0.2.2:12345/my-jq.raw`
4. Boot the VM and drop you into an interactive shell

Once inside the VM, verify the extension loaded:

```bash
systemd-sysext status
# HIERARCHY EXTENSIONS SINCE
# /usr      my-jq      Thu 2026-01-01 10:00:00 UTC

which jq
# /usr/bin/jq

echo '{"hello":"world"}' | jq .
# {
#   "hello": "world"
# }
```

Shut down the VM:

```bash
sudo poweroff
```

## Option B — Manual QEMU setup

If you want full control, do it manually.

### 1. Download a Flatcar QEMU image

```bash
# For x86-64
ARCH="amd64"
BASE="https://alpha.release.flatcar-linux.net/${ARCH}-usr/current"

wget "${BASE}/flatcar_production_qemu_uefi.sh"
wget "${BASE}/flatcar_production_qemu_uefi_efi_code.qcow2"
wget "${BASE}/flatcar_production_qemu_uefi_efi_vars.qcow2"
wget "${BASE}/flatcar_production_qemu_uefi_image.img"
chmod +x flatcar_production_qemu_uefi.sh
```

### 2. Serve the extension image over HTTP

`systemd-sysext` loads extensions from the local filesystem, so we need to get `my-jq.raw` into the VM. The simplest approach is to serve it over HTTP and have Ignition download it at first boot:

```bash
# In a separate terminal — serve the current directory on port 12345
python3 -m http.server 12345
```

### 3. Write a Butane config

Create `test-jq.yaml`:

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /etc/extensions/my-jq.raw
      mode: 0644
      contents:
        # 10.0.2.2 is QEMU's default gateway — reaches your host machine
        source: http://10.0.2.2:12345/my-jq.raw
systemd:
  units:
    - name: update-engine.service
      mask: true
    - name: locksmithd.service
      mask: true
```

Transpile it:

```bash
cat test-jq.yaml | docker run --rm -i quay.io/coreos/butane:latest > test-jq.json
```

### 4. Boot the VM

```bash
./flatcar_production_qemu_uefi.sh \
  -i test-jq.json \
  -- -nographic -snapshot
```

Log in automatically as `core`, then verify:

```bash
systemd-sysext status
echo '{"hello":"world"}' | jq .
```

## Debugging failed merges

### Extension not appearing in `systemd-sysext status`

Enable debug logging and refresh:

```bash
sudo SYSTEMD_LOG_LEVEL=debug systemd-sysext refresh 2>&1 | less
```

Common error messages and what they mean:

| Error | Cause | Fix |
|-------|-------|-----|
| `Extension "my-jq" is missing required metadata file` | `extension-release.my-jq` file not found | Check the exact filename matches the extension name |
| `ID field of extension does not match host` | `ID=` in metadata is not `flatcar` | Set `ID=flatcar` |
| `Version mismatch` | `VERSION_ID=` does not match running Flatcar | Use `SYSEXT_LEVEL=1.0` for static binaries |
| `Sysext image is for a different architecture` | Wrong binary arch | Download the correct arch variant |

### Inspecting an image without booting

```bash
# List all files in the image
sudo systemd-dissect --list my-jq.raw

# Read the metadata file directly
sudo systemd-dissect --with my-jq.raw \
  cat usr/lib/extension-release.d/extension-release.my-jq

# Detailed mtree listing (permissions, owners, sizes)
sudo systemd-dissect --mtree my-jq.raw
```

### Checking if a binary is truly static

```bash
file my-jq/usr/bin/jq
# my-jq/usr/bin/jq: ELF 64-bit LSB executable, x86-64, statically linked
```

If the output says `dynamically linked`, the binary depends on host libraries. Either find a static build or pin your extension to a specific Flatcar `VERSION_ID`.

## Next

[Part 5 — Production deployment →](../production-deployment/)
