---
title: "Part 6: Contributing to sysext-bakery"
linktitle: "6 — Contributing to bakery"
description: Turn your custom extension into a reusable bakery recipe so others can use and benefit from your work.
weight: 60
---

The [sysext-bakery](https://github.com/flatcar/sysext-bakery) repository is the central hub for **community-supported** sysext images. If your custom extension could be useful to others, consider contributing it as a bakery recipe.

## What is a bakery recipe?

A "recipe" is a `create.sh` shell script that automates building an extension image for a given upstream project release. The script:

- Fetches binaries from the upstream project's GitHub releases (or other source)
- Places them in the correct sysext directory structure
- Bundles any required systemd unit files
- Produces a `.raw` squashfs image

Example structure:

```
sysext-bakery/
├── my-tool.sysext/
│   ├── create.sh         ← build script (required)
│   ├── files/            ← static files like systemd units (optional)
│   │   └── usr/lib/systemd/system/my-tool.service
│   └── test.sh           ← smoke tests (optional but encouraged)
└── bakery.sh             ← main build tool
```

## Step-by-step: Turn jq into a bakery recipe

### 1. Fork and clone sysext-bakery

```bash
gh repo fork flatcar/sysext-bakery --clone
cd sysext-bakery
```

### 2. Create the extension directory

```bash
cp -r _skel.sysext jq.sysext
```

### 3. Implement `create.sh`

Open `jq.sysext/create.sh` and replace the TODO sections:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Called by bakery.sh to list all available upstream releases
function list_available_versions() {
  list_github_releases "jqlang" "jq" | sed 's/^jq-//'
}

# Called by bakery.sh to build the extension for a specific version
function populate_sysext_root() {
  local sysextroot="$1"
  local arch="$2"
  local version="$3"

  # Transform arch: x86-64 → amd64, arm64 → arm64
  local rel_arch="$(arch_transform "x86-64" "amd64" "$arch")"

  echo "Downloading jq ${version} for ${arch}"

  mkdir -p "${sysextroot}/usr/bin"

  curl -fsSL -o "${sysextroot}/usr/bin/jq" \
    "https://github.com/jqlang/jq/releases/download/jq-${version}/jq-linux-${rel_arch}"

  chmod +x "${sysextroot}/usr/bin/jq"
}
```

The `list_github_releases` and `arch_transform` helper functions are provided by `lib/libbakery.sh` — you do not need to implement them.

### 4. Test your recipe locally

```bash
# List all available versions
./bakery.sh list jq

# Build the latest version for x86-64
./bakery.sh create jq "$(./bakery.sh list jq --latest true)"
# Produces: jq-<version>-x86-64.raw

# Boot a test VM with the extension loaded
./bakery.sh boot jq-*.raw
```

Inside the VM:

```bash
which jq
echo '{"test":true}' | jq .
```

### 5. Add smoke tests (recommended)

Edit `jq.sysext/test.sh`:

```bash
#!/usr/bin/env bash

function run_tests() {
  test_extension_release_present "jq"
  test_no_usr_sbin
  test_binary_exists "jq"
}
```

Run the tests:

```bash
# Extract the sysext root from the .raw image
mkdir -p /tmp/jq-root
sudo mount -o loop,ro jq-*.raw /tmp/jq-root

# Run tests
./bakery.sh test /tmp/jq-root jq

# Cleanup
sudo umount /tmp/jq-root
```

### 6. Open a pull request

```bash
git checkout -b add-jq-sysext
git add jq.sysext
git commit -s -m "jq.sysext: add jq JSON processor extension"
git push -u origin add-jq-sysext
gh pr create --repo flatcar/sysext-bakery --fill
```

In your PR description:

- Link to the upstream project (e.g. `https://github.com/jqlang/jq`)
- Note that binaries are statically linked (or if not, explain why `VERSION_ID` coupling is required)
- Confirm you tested the extension on Flatcar (include output of `jq --version`)

## Bakery conventions

| Convention | Why |
|------------|-----|
| **Static binaries preferred** | Avoid coupling to Flatcar release versions |
| **No `/usr/sbin`** | Flatcar's `/usr/sbin` is a symlink; shipping it breaks the host |
| **Use `Upholds=` drop-ins for units** | Shipping WantedBy symlinks in sysexts is brittle |
| **Fetch from GitHub releases** | Predictable, versioned, and easy to automate |
| **Test coverage encouraged** | Even minimal smoke tests catch regressions |

## After your PR is merged

- Your extension will be built and published automatically on every new upstream release
- It will appear at `https://extensions.flatcar.org/<your-extension>.raw`
- It will be listed on the [bakery documentation site](https://flatcar.github.io/sysext-bakery/)
- Other users can provision it with `systemd-sysupdate` or Ignition

## Next steps

You have now completed the full sysext tutorial. You know how to:

- Use official and bakery extensions
- Build custom sysext images from scratch
- Test extensions locally with QEMU
- Deploy extensions in production with Ignition and systemd-sysupdate
- Contribute reusable recipes back to sysext-bakery

For deeper reference material and advanced topics, return to the [main sysext documentation page](../../).
