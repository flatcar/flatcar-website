---
title: "Part 5: Production Deployment"
linktitle: "5 — Production deployment"
description: Deploy custom sysext images via Ignition, host them on object storage, and configure automatic updates with systemd-sysupdate.
weight: 50
---

## Hosting your extension image

Your extension image needs to be reachable over HTTPS from your Flatcar nodes. Any static file host works:

- AWS S3 / S3-compatible (MinIO, Cloudflare R2)
- Azure Blob Storage
- GCP Cloud Storage
- A plain HTTPS web server (nginx, caddy)
- GitHub Releases

Example: Upload to S3:

```bash
aws s3 cp my-jq.raw s3://my-flatcar-assets/extensions/my-jq.raw --acl public-read
```

Note the public HTTPS URL — you will use it in the Butane config below.

## Provisioning via Ignition at first boot

### Basic — download at first boot

This Butane config downloads `my-jq.raw` from your server during Ignition provisioning:

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /etc/extensions/my-jq.raw
      mode: 0644
      contents:
        source: https://my-flatcar-assets.example.com/extensions/my-jq.raw
```

Transpile and use as user data for your cloud instance or VM.

### With checksum verification (recommended)

Always verify the image integrity in production:

```bash
# Generate the sha512 hash of your image
sha512sum my-jq.raw
# abc123...  my-jq.raw
```

Add the `verification` field to your Butane config:

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /etc/extensions/my-jq.raw
      mode: 0644
      contents:
        source: https://my-flatcar-assets.example.com/extensions/my-jq.raw
        verification:
          hash: sha512-abc123...
```

Ignition will refuse to boot if the downloaded file does not match the hash.

### Multiple extensions

Provision multiple bakery or custom extensions in one config:

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /etc/extensions/my-jq.raw
      mode: 0644
      contents:
        source: https://my-flatcar-assets.example.com/extensions/my-jq.raw

    - path: /etc/extensions/tailscale.raw
      mode: 0644
      contents:
        source: https://extensions.flatcar.org/tailscale.raw

    # Disable built-in docker if this node uses a custom containerd
  links:
    - path: /etc/extensions/docker-flatcar.raw
      target: /dev/null
      overwrite: true
```

## Automatic updates with systemd-sysupdate

From Flatcar **3510.2.0** onwards, `systemd-sysupdate` can update your extension images in the background — the same way Flatcar updates the OS itself.

### How it works

You publish new versions of your extension at a predictable URL pattern:

```
https://my-flatcar-assets.example.com/extensions/my-jq-1.7.1-x86-64.raw
https://my-flatcar-assets.example.com/extensions/my-jq-1.8.0-x86-64.raw
                                                         ↑
                                                  version in the filename
```

And a `SHA256SUMS` file listing all available versions.

`systemd-sysupdate` checks the manifest on a schedule, downloads new versions, and atomically swaps the extension file.

### sysupdate configuration file

Place this file at `/etc/sysupdate.my-jq.d/my-jq.conf`:

```ini
[Transfer]
Verify=false

[Source]
Type=url-file
Path=https://my-flatcar-assets.example.com/extensions/
MatchPattern=my-jq-@v-%a.raw

[Target]
Type=regular-file
Path=/etc/extensions
MatchPattern=my-jq-@v-%a.raw
CurrentSymlink=/etc/extensions/my-jq.raw
```

`@v` is replaced by the version and `%a` by the architecture (`x86-64` or `arm64`).

### Provision the sysupdate config via Butane

```yaml
variant: flatcar
version: 1.0.0
storage:
  directories:
    - path: /etc/sysupdate.my-jq.d
      mode: 0755
  files:
    - path: /etc/sysupdate.my-jq.d/my-jq.conf
      mode: 0644
      contents:
        inline: |
          [Transfer]
          Verify=false

          [Source]
          Type=url-file
          Path=https://my-flatcar-assets.example.com/extensions/
          MatchPattern=my-jq-@v-%a.raw

          [Target]
          Type=regular-file
          Path=/etc/extensions
          MatchPattern=my-jq-@v-%a.raw
          CurrentSymlink=/etc/extensions/my-jq.raw

systemd:
  units:
    - name: systemd-sysupdate.timer
      enabled: true
```

The `systemd-sysupdate.timer` unit runs the update check periodically (default: once a day).

### Trigger an update manually

```bash
sudo systemd-sysupdate --component=my-jq update
sudo systemctl restart systemd-sysext
```

## Baking extensions into a custom Flatcar image

If you manage your own image pipeline, you can pre-bake extension images into the Flatcar root filesystem so they are available on first boot without any network download.

The [`bake_flatcar_image.sh`](https://flatcar.github.io/sysext-bakery/#baking-sysexts-into-flatcar-os-images) helper in sysext-bakery handles this:

```bash
./tools/bake_flatcar_image.sh \
  --image flatcar_production_image.bin \
  --extension my-jq.raw
```

## Next

[Part 6 — Contributing to sysext-bakery →](../contributing-to-bakery/)
