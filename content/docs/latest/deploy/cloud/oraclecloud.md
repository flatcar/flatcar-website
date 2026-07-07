---
title: OracleCloud
linktitle: OracleCloud
weight: 90
---

These instructions will walk you through using Flatcar on [OracleCloud][oraclecloud], importing an image, and running your first server using the command line interface.

## Import the image

_Note_: This getting started assumes that OracleCloud CLI is already installed and properly configured (using CLI from Oracle Cloud Shell is a good alternative as well), `jq` is in the `$PATH` and a subnet is created

It is possible to import a Flatcar image in OracleCloud using the [CLI][cli]. The process is done in two steps:
1. Upload Flatcar image on OracleCloud bucket
2. Create a "Custom Image" from the imported object

For example, to upload an image from the Flatcar Alpha channel:

```bash
export COMPARTMENT_ID="<insert compartment OCID>"

export CHANNEL="${CHANNEL:-alpha}"
export VERSION="${VERSION:-current}"
export ARCH="${ARCH:-amd64}"
export BUCKET_NAME="flatcar-${CHANNEL}"

# Create the bucket
oci os bucket create --name "${BUCKET_NAME}" --compartment-id "${COMPARTMENT_ID}"
# Download Flatcar image
curl --fail --silent --show-error --location --remote-name "https://${CHANNEL}.release.flatcar-linux.net/${ARCH}-usr/${VERSION}/flatcar_production_oraclecloud_image.img"
# Upload Flatcar image to the bucket
oci os object put --bucket-name "${BUCKET_NAME}" --file ./flatcar_production_oraclecloud_image.img

# Get the default object storage namespace
namespace=$(oci os ns get | jq -r .data)
# Create a custom OCI compute image from the uploaded Flatcar image
oci compute image import from-object --compartment-id "${COMPARTMENT_ID}" --bucket-name "${BUCKET_NAME}" --name flatcar_production_oraclecloud_image.img --namespace "${namespace}" --display-name "flatcar-${CHANNEL}-${VERSION}"

# Get the image ID to later use it when launching the instance
IMAGE_ID=$(oci compute image list --compartment-id "${COMPARTMENT_ID}" --display-name "flatcar-${CHANNEL}-${VERSION}" | jq -r ".data[0].id")

# Update the launch configuration to use BIOS
cat > bios.json <<EOF
{
  "Compute.Firmware": {
    "default-value": "BIOS",
    "descriptor-type": "enumstring",
    "source": "GLOBAL",
    "values": [
      "BIOS",
      "UEFI_64"
    ]
  }
}
EOF
IMAGE_CAPABILITY_VERSION_NAME=$(oci compute global-image-capability-schema list | jq -r '.data[0]."current-version-name"')
oci compute image-capability-schema create --global-image-capability-schema-version-name "${IMAGE_CAPABILITY_VERSION_NAME}" --image-id "${IMAGE_ID}" --schema-data file://bios.json --compartment-id "${COMPARTMENT_ID}"
```

## Butane Configs

Flatcar allows you to configure machine parameters, launch systemd units on startup and more via Butane Configs. These configs are then transpiled into Ignition JSON configs and given to booting machines. Jump over to the [docs to learn about the supported features][butane-configs]. We're going to provide an Ignition Config to OracleCloud via the user-data flag. Our Butane Config will also contain SSH keys that will be used to connect to the instance.

As an example, this Butane YAML config will start an Nginx Docker container and display the instance hostname:

```yaml
variant: flatcar
version: 1.0.0
passwd:
  users:
    - name: core
      ssh_authorized_keys:
        - ssh-rsa ABCD...
storage:
  directories:
    - path: /var/www
systemd:
  units:
    - name: nginx.service
      enabled: true
      contents: |
        [Unit]
        Description=NGINX example
        After=docker.service coreos-metadata.service
        Requires=docker.service coreos-metadata.service
        [Service]
        EnvironmentFile=/run/metadata/flatcar
        TimeoutStartSec=0
        ExecStartPre=-/usr/bin/docker rm --force nginx1
        ExecStartPre=-/usr/bin/bash -c "echo 'Hello from ${COREOS_ORACLECLOUD_HOSTNAME}' > /var/www/index.html"
        ExecStart=/usr/bin/docker run --name nginx1 --volume "/var/www:/usr/share/nginx/html:ro" --pull always --log-driver=journald --net host docker.io/nginx:1
        ExecStop=/usr/bin/docker stop nginx1
        Restart=always
        RestartSec=5s
        [Install]
        WantedBy=multi-user.target
```

Transpile it to Ignition JSON:

```bash
cat butane.yaml | docker run --rm -i quay.io/coreos/butane:release > config.json
```

The `coreos-metadata.service` saves metadata variables to `/run/metadata/flatcar`. Systemd units can use them with `EnvironmentFile=/run/metadata/flatcar` in the `[Service]` section when setting `Requires=coreos-metadata.service` and `After=coreos-metadata.service` in the `[Unit]` section.

## Launch machine

Boot the machine with the CLI, referencing the image ID from the import step above and your [Ignition file from Butane][butane-configs]:

```bash
SUBNET_ID="<insert subnet ID>"

AVAILABILITY_DOMAIN="${AVAILABILITY_DOMAIN:-YQPA:US-ASHBURN-AD-1}"
SHAPE="${SHAPE:-VM.Standard.B1.1}"

INSTANCE_ID=$(oci compute instance launch \
  --compartment-id "${COMPARTMENT_ID}" \
  --image-id "${IMAGE_ID}" \
  --user-data-file ./config.json \
  --availability-domain "${AVAILABILITY_DOMAIN}" \
  --assign-public-ip true \
  --subnet-id "${SUBNET_ID}" \
  --shape "${SHAPE}" \
  | jq -r ".data.id")
```

Your first Flatcar instance should now be running. The only thing left to do is find the IP address and SSH in.

```bash
IPV4=$(oci compute instance list-vnics --instance-id "${INSTANCE_ID}" | jq -r '.data[0]."public-ip"')
```

Finally SSH into an instance, note that the user is `core`:

```text
ssh core@"${IPV4}"
core@instance20260609133043 ~ $ curl localhost
Hello from instance20260609133043
```

## Using Flatcar Container Linux

Now that you have a machine booted it is time to play around. Check out the [Flatcar Container Linux Quickstart][quickstart] guide or dig into [more specific topics][doc-index].

[butane-configs]: ../../fb-provision/butane
[cli]: https://github.com/oracle/oci-cli
[doc-index]: ../../
[quickstart]: ../../getting-started/quickstart
[oraclecloud]: https://www.cloud.oracle.com/
