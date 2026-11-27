---
title: Outscale (community support)
linktitle: Outscale (community support)
weight: 205
---

These instructions will walk you through using Flatcar on [Outscale][outscale], importing an image, and running your first server using the command line interface.

_Note_: Only the AMD64 architecture is currently available on Outscale.

## Import the image

_Note_: This guide assumes that the Outscale CLI ([`octl`][cli]) is installed and configured with a working profile, that this profile has read and write access to the OOS (Outscale Object Storage) bucket used below, and that `jq`, `qemu-img` and `docker` (used to run Butane) are in the `$PATH`. octl uses the same profile for OOS as for the rest of the API, so OOS needs no extra configuration.

It is possible to import a Flatcar image in Outscale using the CLI. The process is done in three steps:
1. Upload the Flatcar image on an OOS bucket
2. Describe the image in a manifest file and upload it as well
3. Create an OMI (Outscale Machine Image) from the manifest

An OMI is not shared between regions, so repeat the steps below in every region you need, using a profile configured for that region (`octl` takes the region from the profile). Pre-signed URLs are valid for 7 days at most.

For example, to import an image from the Flatcar Alpha channel:

```bash
export BUCKET_NAME="<insert bucket name>"
export OSC_PROFILE="${OSC_PROFILE:-default}"

export CHANNEL="${CHANNEL:-alpha}"
export VERSION="${VERSION:-current}"
export IMAGE_NAME="flatcar-${CHANNEL}-${VERSION}"

# Download Flatcar image
curl --fail --silent --show-error --location --remote-name "https://${CHANNEL}.release.flatcar-linux.net/amd64-usr/${VERSION}/flatcar_production_outscale_image.qcow2.gz"
# Get the size of the disk once decompressed (the OMI is created from the compressed file as is)
gzip --decompress --keep ./flatcar_production_outscale_image.qcow2.gz
DISK_SIZE=$(qemu-img info --output json ./flatcar_production_outscale_image.qcow2 | jq -r '."virtual-size"')

# Upload Flatcar image to the bucket and generate a pre-signed URL for it
octl storage object put "${IMAGE_NAME}.qcow2.gz" --bucket "${BUCKET_NAME}" --body ./flatcar_production_outscale_image.qcow2.gz
IMAGE_URL=$(octl storage object presign "${IMAGE_NAME}.qcow2.gz" --bucket "${BUCKET_NAME}" --expires 168h)

# Write the manifest, upload it and generate a pre-signed URL for it
jq -n --arg name "${IMAGE_NAME}" --arg file "${IMAGE_NAME}.qcow2.gz" --arg url "${IMAGE_URL}" --argjson size "${DISK_SIZE}" '
{
  Version: 1,
  Image: {
    Name: $name,
    Architecture: "x86_64",
    Type: "machine",
    ProductTypes: ["0001"],
    Public: false,
    BootModes: ["uefi"],
    Snapshots: [
      {
        Device: "/dev/sda1",
        Filename: $file,
        PreSignedUrl: $url,
        Size: $size,
        VolumeType: "standard",
        DeleteOnTermination: true
      }
    ]
  }
}' > manifest.json
octl storage object put "${IMAGE_NAME}-manifest.json" --bucket "${BUCKET_NAME}" --body ./manifest.json
MANIFEST_URL=$(octl storage object presign "${IMAGE_NAME}-manifest.json" --bucket "${BUCKET_NAME}" --expires 168h)

# Create the OMI from the manifest
IMAGE_ID=$(octl iaas image create --name "${IMAGE_NAME}" --file-location "${MANIFEST_URL}" -o json | jq -r ".ImageId")

# Wait for the image to be "available"
octl iaas image describe "${IMAGE_ID}" --waitfor '.State=="available"'
```

The image supports two boot modes, `legacy` and `uefi`. Pick one in `BootModes` in the manifest.

The import takes a few minutes. See the Outscale documentation about [importing an OMI from a bucket][import-doc] for more details.

## Butane Configs

Flatcar allows you to configure machine parameters, launch systemd units on startup and more via Butane Configs. These configs are then transpiled into Ignition JSON configs and given to booting machines. Jump over to the [docs to learn about the supported features][butane-configs]. We're going to transpile our Butane Config and provide the resulting Ignition config to Outscale via the user data. The SSH key of the keypair given at launch is set by Afterburn for the `core` user, so the config below does not need one.

As an example, save this Butane YAML config as `butane.yaml`. It will write a file on the machine and run a systemd unit that displays the instance hostname:

```yaml
variant: flatcar
version: 1.1.0
storage:
  files:
    - path: /etc/file
      mode: 0644
      contents:
        inline: |
          Hello, world!
systemd:
  units:
    - name: hello-metadata.service
      enabled: true
      contents: |
        [Unit]
        Description=Hello from metadata
        After=coreos-metadata.service
        Requires=coreos-metadata.service
        [Service]
        Type=oneshot
        RemainAfterExit=yes
        EnvironmentFile=/run/metadata/flatcar
        ExecStart=/usr/bin/bash -c "echo 'Hello from ${COREOS_OUTSCALE_HOSTNAME}' > /etc/hello"
        [Install]
        WantedBy=multi-user.target
```

Transpile it to Ignition JSON:

```bash
docker run --rm -i quay.io/coreos/butane:release < butane.yaml > ignition.json
```

The `coreos-metadata.service` saves metadata variables (`COREOS_OUTSCALE_HOSTNAME`, `COREOS_OUTSCALE_LOCAL_IPV4`, `COREOS_OUTSCALE_INSTANCE_ID`, `COREOS_OUTSCALE_AVAILABILITY_ZONE`, ...) to `/run/metadata/flatcar`. The service is started on demand, so the file does not exist until a unit requires it. Systemd units can use the variables with `EnvironmentFile=/run/metadata/flatcar` in the `[Service]` section when setting `Requires=coreos-metadata.service` and `After=coreos-metadata.service` in the `[Unit]` section.

## Launch machine

Boot the machine with the CLI, referencing the image ID from the import step above and the Ignition config generated from your Butane Config. Outscale expects the user data to be Base64-encoded; `octl` encodes the file for you. The machine needs a keypair and a security group allowing inbound SSH (22/tcp):

```bash
KEYPAIR_NAME="<insert keypair name>"
SECURITY_GROUP_ID="<insert security group ID>"

VM_TYPE="${VM_TYPE:-tinav6.c2r4p1}"

VM_ID=$(octl iaas vm create \
  --image-id "${IMAGE_ID}" \
  --type "${VM_TYPE}" \
  --keypair-name "${KEYPAIR_NAME}" \
  --security-group-id "${SECURITY_GROUP_ID}" \
  --user-data ./ignition.json \
  -o json | jq -r ".VmId")
```

Your first Flatcar instance should now be running. The only thing left to do is find the IP address and SSH in.

```bash
IPV4=$(octl iaas vm describe "${VM_ID}" -o json | jq -r ".PublicIp")
```

Finally SSH into an instance, note that the user is `core`:

```text
ssh core@"${IPV4}"
core@ip-10-8-1-100 ~ $ cat /etc/file
Hello, world!
core@ip-10-8-1-100 ~ $ cat /etc/hello
Hello from ip-10-8-1-100.eu-west-2.compute.internal
```

When you are done, delete the machine (and the image if you do not need it anymore):

```bash
octl iaas vm delete "${VM_ID}" --yes
octl iaas image delete "${IMAGE_ID}" --yes
```

## Using Flatcar Container Linux

Now that you have a machine booted it is time to play around. Check out the [Flatcar Container Linux Quickstart][quickstart] guide or dig into [more specific topics][doc-index].

[butane-configs]: ../../fb-provision/butane
[cli]: https://github.com/outscale/octl
[import-doc]: https://docs.outscale.com/en/userguide/Importing-an-OMI-from-a-Bucket.html
[doc-index]: ../../
[quickstart]: ../../getting-started/quickstart
[outscale]: https://outscale.com/
