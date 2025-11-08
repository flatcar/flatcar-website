---
title: Running Flatcar on STACKIT
linktitle: Running on STACKIT
weight: 10
aliases:
    - ../../os/booting-on-stackit
    - ../../cloud-providers/booting-on-stackit
---
[STACKIT Cloud](https://www.stackit.cloud) is a european business cloud provider.  
This guide shows you how to run Flatcar Container Linux on STACKIT Cloud by uploading a custom image and creating a server instance with it.

These instructions require Flatcar with version `4230.2.1` or newer.

### Prerequisites

Before you start, ensure you have the following:
- A STACKIT account, organization, and a project.
- The [STACKIT CLI](https://github.com/stackitcloud/stackit-cli) installed and configured on your machine.

Before you start, make sure to define all environment variables in order to reuse them in the next steps:
```text
export PROJECT_ID="your project ID"
export SERVER_NAME="flatcar"
export FLATCAR_IMAGE_PATH="/path/to/your/flatcar_production_stackit_image.img"
export PRIVATE_KEY_PATH="/path/to/your/private/key"

export PUBLIC_KEY_PATH="@${PRIVATE_KEY_PATH}.pub"
export IMAGE_NAME="flatcar-stable"
export FLATCAR_VERSION="4230.2.1"
export KEY_NAME="flatcar-key"
export SECURITY_GROUP_NAME="flatcar-sg"
export NETWORK_NAME="flatcar-network"
export ARCH="x86"
export MACHINE_TYPE="g1a.4d" # change this if you use arm64, e.g. g1r.8d
```
Load these with `source flatcar.env`

## Step 1: Upload the Flatcar image
First, upload your desired Flatcar image to your STACKIT project.

```shell
IMAGE_ID=$(
  stackit image create --name "${IMAGE_NAME}" \
    --os-version "${FLATCAR_VERSION}" \
    --disk-format qcow2 \
    --local-file-path "${FLATCAR_IMAGE_PATH}" \
    --os linux \
    --os-distro flatcar \
    --architecture "${ARCH}" \
    --project-id "${PROJECT_ID}" \
    -o json -y | \
  jq -r ".id"
)
```

You can verify the upload by listing all available images in your project:
```shell
stackit image list --project-id "${PROJECT_ID}"
```

## Step 2: Prepare the server environment

Before creating the server, you need to prepare several components: an SSH key for access, a network for connectivity, a security group with a rule to allow SSH, and a public IP address.

### 1. Create an SSH key
If you don't have one already, upload your public SSH key to STACKIT. This allows you to securely access your server later.
```shell
stackit key-pair create --name "${KEY_NAME}" --public-key "${PUBLIC_KEY_PATH}"
```

### 2. Create a network
Your server needs to be attached to a network.
```shell
NETWORK_ID=$(
  stackit network create --name "${NETWORK_NAME}" \
    --project-id "${PROJECT_ID}" \
    -o json -y | \
  jq  -r ".networkId"
)
```

### 3. Create a security group and rule
First, create the security group that will contain the firewall rules.
```shell
SECURITY_GROUP_ID=$(
  stackit security-group create --name "${SECURITY_GROUP_NAME}"  \
    --project-id "${PROJECT_ID}" \
    -o json -y | \
  jq  -r ".id"
)
```

Next, add a rule to it to allow incoming SSH traffic on port 22.
```shell
stackit security-group rule create --security-group-id "${SECURITY_GROUP_ID}" \
  --direction ingress \
  --protocol-name tcp \
  --port-range-max 22 \
  --port-range-min 22 \
  --description "Allow SSH access" \
  --project-id "${PROJECT_ID}" \
  -y
```

### 4. Create a public IP address
Create a public IP address that you will later attach to the server.
```shell
PUBLIC_IP_ID=$(
  stackit public-ip create --project-id "${PROJECT_ID}" -o json -y | jq  -r ".id"
)
```

Get the IP address you created.
```shell
PUBLIC_IP=$(
  stackit public-ip describe "${PUBLIC_IP_ID}" --project-id "${PROJECT_ID}" -o json -y | jq -r ".ip"
)
```

### 5. (Optional) Automatic configuration with Butane and User Data

You can automatically configure your Flatcar Container Linux instances on first boot using Butane configs. Butane is a user-friendly tool that generates a final Ignition configuration file used by the booting machine.

On STACKIT, you provide this final configuration to your server via the User Data field.

#### 5.1 Create the Butane file
As an example, create a file named `butane.yaml` that starts an Nginx container and displays the instance hostname:
```yaml
variant: flatcar
version: 1.0.0
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
        ExecStartPre=-/usr/bin/bash -c "echo 'Hello from ${COREOS_OPENSTACK_HOSTNAME}' > /var/www/index.html"
        ExecStart=/usr/bin/docker run --name nginx1 --volume "/var/www:/usr/share/nginx/html:ro" --pull always --log-driver=journald --net host docker.io/nginx:1
        ExecStop=/usr/bin/docker stop nginx1
        Restart=always
        RestartSec=5s
        [Install]
        WantedBy=multi-user.target
```

#### 5.2 Convert Butane to Ignition
This Butane file must be converted into an Ignition file (`ignition.json`) before use:
```shell
cat butane.yaml | docker run --rm -i quay.io/coreos/butane:release > ignition.json
```

## Step 3: Create and access the server
Now you have all the necessary components to create your Flatcar server.
### 1. Create the server
Create your server with all resources you created above.
```shell
SERVER_ID=$(
  stackit server create --name "${SERVER_NAME}" \
    --project-id "${PROJECT_ID}" \
    --machine-type "${MACHINE_TYPE}" \
    --boot-volume-source-id "${IMAGE_ID}" \
    --network-id "${NETWORK_ID}" \
    --keypair-name "${KEY_NAME}" \
    --availability-zone eu01-2 \
    --boot-volume-source-type image \
    --boot-volume-size 50 \
    --security-groups "${SECURITY_GROUP_ID}" \
    -o json -y | \
  jq  -r ".id"
)
```

If you created an Ignition file, include the additional `--user-data @/path/to/your/ignition.json` flag.  
Make sure to use the `@` prefix, which tells the CLI to load the contents of your Ignition file.

### 2. Attach a public IP
Then, attach the IP to your server:
```shell
stackit server public-ip attach "${PUBLIC_IP_ID}" --server-id "${SERVER_ID}" --project-id "${PROJECT_ID}" -y
```

### 3. Connect to your server
Your Flatcar server is running and your public IP address is attached.  
You can now connect to it via SSH using the user core and your private SSH key.
```shell
ssh core@"${PUBLIC_IP}" -i "${PRIVATE_KEY_PATH}"
```

### 4. (Optional) Verify your nginx configuration
If you configured the server with the example Butane file to run an Nginx container, you can verify that it's working after you have connected via SSH.

Run the `curl` command to check the local web server:
```shell
curl localhost
```

This confirms your User Data script was executed successfully. You should see a "Hello" message from the container, which includes the server's unique hostname:
```shell
Hello from <HOSTNAME>
```
