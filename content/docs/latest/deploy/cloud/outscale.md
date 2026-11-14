---
title: Outscale (community support)
linktitle: Outscale (community support)
weight: 205
---

These instructions will walk you through using Flatcar on [Outscale][outscale], importing an image, and running your first server using the command line interface.

## Import the image

_Note_: This getting started assumes that the Outscale CLI ([`osc-cli`][cli]) is already installed and configured with a profile, the AWS CLI is configured for Outscale Object Storage (OOS), `jq` and `qemu-img` are in the `$PATH`, and that you have an OOS bucket

It is possible to import a Flatcar image in Outscale using the CLI. The process is done in three steps:
1. Upload the Flatcar image on an OOS bucket
2. Describe the image in a manifest file and upload it as well
3. Create an OMI (Outscale Machine Image) from the manifest

An OMI is not shared between regions, so repeat the steps below in every region you need. Pre-signed URLs are valid for 7 days at most.

For example, to import an image from the Flatcar Alpha channel:

```bash
export REGION="${REGION:-eu-west-2}"
export BUCKET_NAME="<insert bucket name>"
export OSC_PROFILE="${OSC_PROFILE:-default}"
export OOS_ENDPOINT="https://oos.${REGION}.outscale.com"
# Recent AWS CLI versions send a checksum that Outscale Object Storage rejects
export AWS_REQUEST_CHECKSUM_CALCULATION="when_required"

export CHANNEL="${CHANNEL:-alpha}"
export VERSION="${VERSION:-current}"
export ARCH="${ARCH:-amd64}"
export IMAGE_NAME="flatcar-${CHANNEL}-${VERSION}"

# Download Flatcar image
curl --fail --silent --show-error --location --remote-name "https://${CHANNEL}.release.flatcar-linux.net/${ARCH}-usr/${VERSION}/flatcar_production_outscale_image.qcow2.gz"
# Get the size of the disk once decompressed (the OMI is created from the compressed file as is)
gzip --decompress --keep ./flatcar_production_outscale_image.qcow2.gz
DISK_SIZE=$(qemu-img info --output json ./flatcar_production_outscale_image.qcow2 | jq -r '."virtual-size"')

# Upload Flatcar image to the bucket and generate a pre-signed URL for it
aws s3 cp ./flatcar_production_outscale_image.qcow2.gz "s3://${BUCKET_NAME}/${IMAGE_NAME}.qcow2.gz" --endpoint-url "${OOS_ENDPOINT}"
IMAGE_URL=$(aws s3 presign "s3://${BUCKET_NAME}/${IMAGE_NAME}.qcow2.gz" --expires-in 604800 --endpoint-url "${OOS_ENDPOINT}")

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
    BootModes: ["legacy"],
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
aws s3 cp ./manifest.json "s3://${BUCKET_NAME}/${IMAGE_NAME}-manifest.json" --endpoint-url "${OOS_ENDPOINT}"
MANIFEST_URL=$(aws s3 presign "s3://${BUCKET_NAME}/${IMAGE_NAME}-manifest.json" --expires-in 604800 --endpoint-url "${OOS_ENDPOINT}")

# Create the OMI from the manifest
IMAGE_ID=$(osc-cli api CreateImage --profile "${OSC_PROFILE}" --ImageName "${IMAGE_NAME}" --FileLocation "${MANIFEST_URL}" | jq -r ".Image.ImageId")

# Wait for the image to be "available"
osc-cli api ReadImages --profile "${OSC_PROFILE}" --Filters "{\"ImageIds\":[\"${IMAGE_ID}\"]}" | jq -r ".Images[0].State"
```

The import takes a few minutes. See the Outscale documentation about [importing an OMI from a bucket][import-doc] for more details.

## Butane Configs

Flatcar allows you to configure machine parameters, launch systemd units on startup and more via Butane Configs. These configs are then transpiled into Ignition JSON configs and given to booting machines. Jump over to the [docs to learn about the supported features][butane-configs]. We're going to provide an Ignition Config to Outscale via the user data. The SSH key of the keypair given at launch is set by Afterburn for the `core` user, so the config below does not need one.

As an example, this Butane YAML config will write a file on the machine and run a systemd unit that displays the instance hostname:

```yaml
variant: flatcar
version: 1.0.0
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
cat butane.yaml | docker run --rm -i quay.io/coreos/butane:release > config.json
```

The `coreos-metadata.service` saves metadata variables (`COREOS_OUTSCALE_HOSTNAME`, `COREOS_OUTSCALE_LOCAL_IPV4`, `COREOS_OUTSCALE_INSTANCE_ID`, `COREOS_OUTSCALE_AVAILABILITY_ZONE`, ...) to `/run/metadata/flatcar`. The service is started on demand, so the file does not exist until a unit requires it. Systemd units can use the variables with `EnvironmentFile=/run/metadata/flatcar` in the `[Service]` section when setting `Requires=coreos-metadata.service` and `After=coreos-metadata.service` in the `[Unit]` section.

## Launch machine

Boot the machine with the CLI, referencing the image ID from the import step above and your [Ignition file from Butane][butane-configs]. Outscale expects the user data to be Base64-encoded. The machine needs a keypair and a security group allowing inbound SSH (22/tcp):

```bash
KEYPAIR_NAME="<insert keypair name>"
SECURITY_GROUP_ID="<insert security group ID>"

VM_TYPE="${VM_TYPE:-tinav6.c2r4p1}"

VM_ID=$(osc-cli api CreateVms --profile "${OSC_PROFILE}" \
  --ImageId "${IMAGE_ID}" \
  --VmType "${VM_TYPE}" \
  --KeypairName "${KEYPAIR_NAME}" \
  --SecurityGroupIds "[\"${SECURITY_GROUP_ID}\"]" \
  --UserData "$(base64 < ./config.json | tr -d '\n')" \
  | jq -r ".Vms[0].VmId")
```

Your first Flatcar instance should now be running. The only thing left to do is find the IP address and SSH in.

```bash
IPV4=$(osc-cli api ReadVms --profile "${OSC_PROFILE}" --Filters "{\"VmIds\":[\"${VM_ID}\"]}" | jq -r ".Vms[0].PublicIp")
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
osc-cli api DeleteVms --profile "${OSC_PROFILE}" --VmIds "[\"${VM_ID}\"]"
osc-cli api DeleteImage --profile "${OSC_PROFILE}" --ImageId "${IMAGE_ID}"
```

## Using Flatcar Container Linux

Now that you have a machine booted it is time to play around. Check out the [Flatcar Container Linux Quickstart][quickstart] guide or dig into [more specific topics][doc-index].

[butane-configs]: ../../fb-provision/butane
[cli]: https://github.com/outscale/osc-cli
[import-doc]: https://docs.outscale.com/en/userguide/Importing-an-OMI-from-a-Bucket.html
[doc-index]: ../../
[quickstart]: ../../getting-started/quickstart
[outscale]: https://outscale.com/
