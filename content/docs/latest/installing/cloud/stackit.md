---
title: How to run Flatcar Container Linux on STACKIT Cloud
linktitle: Running FLatcar on STACKIT
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

## Step 1: Upload the Flatcar Image
First, upload your desired Flatcar image to your STACKIT project. Replace `<...>` with your own values.

For `amd64` architecture:
```shell
stackit image create --name <IMAGE_NAME> \
  --os-version <FLATCAR_VERSION> \
  --disk-format qcow2 \
  --local-file-path /path/to/your/flatcar_production_stackit_image.img \
  --os linux \
  --os-distro coreos \
  --project-id <PROJECT_ID>
```

For `arm64` architecture:
```shell
stackit image create --name <IMAGE_NAME> \
  --os-version <FLATCAR_VERSION> \
  --disk-format qcow2 \
  --local-file-path /path/to/your/flatcar_production_stackit_image.img \
  --os linux \
  --os-distro coreos \
  --architecture arm64 \
  --project-id <PROJECT_ID>
```
After a successful upload, the CLI will display the image ID. Copy this ID, you will need it later to create the server.
```shell
Created image "<IMAGE_NAME>" with id <IMAGE_ID>
```

You can verify the upload by listing all available images in your project:
```shell
stackit image list --project-id <PROJECT_ID>
```

## Step 2: Prepare the Server Environment

Before creating the server, you need to prepare several components: an SSH key for access, a network for connectivity, a security group with a rule to allow SSH, and a public IP address.

### 1. Create an SSH Key
If you don't have one already, upload your public SSH key to STACKIT. This allows you to securely access your server later.
```shell
stackit key-pair create --name <KEY_NAME> --public-key "ssh-ed25519 AAAA..."
```

### 2. Create a Network
Your server needs to be attached to a network.
```shell
stackit network create --name <NETWORK_NAME> --project-id <PROJECT_ID>
```
Note down the network ID from the output.

### 3. Create a Security Group and Rule
First, create the security group that will contain the firewall rules.
```shell
stackit security-group create --name <SECURITY_GROUP_NAME> --project-id <PROJECT_ID>
```
Note down the security group ID. Next, add a rule to it to allow incoming SSH traffic on port 22.
```shell
stackit security-group rule create --security-group-id <SECURITY_GROUP_ID> \
  --direction ingress \
  --protocol-name tcp \
  --port-range-max 22 \
  --port-range-min 22 \
  --description "Allow SSH access" \
  --project-id <PROJECT_ID>
```

### 4. Create a Public IP Address
Create a public IP address that you will later attach to the server.
```shell
stackit public-ip create --project-id <PROJECT_ID>
```
Copy the public IP ID and the IP address itself from the output.

### 5. (Optional) Automatic Configuration with Butane and User Data

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

## Step 3: Create and Access the Server
Now you have all the necessary components to create your Flatcar server.
### 1. Create the Server
Use the IDs from the previous steps to launch the instance.
For `amd64` (x86) servers:
```shell
stackit server create --name <SERVER_NAME> \
  --project-id <PROJECT_ID> \
  --machine-type g1a.4d \
  --boot-volume-source-id <AMD64_IMAGE_ID> \
  --network-id <NETWORK_ID> \
  --keypair-name <KEY_NAME> \
  --availability-zone eu01-2 \
  --boot-volume-source-type image \
  --boot-volume-size 50 \
  --security-groups <SECURITY_GROUP_ID>
```

For `arm64` servers:
```shell
stackit server create --name <SERVER_NAME> \
  --project-id <PROJECT_ID> \
  --machine-type g1r.8d \
  --boot-volume-source-id <ARM64_IMAGE_ID> \
  --network-id <NETWORK_ID> \
  --keypair-name <KEY_NAME> \
  --availability-zone eu01-2 \
  --boot-volume-source-type image \
  --boot-volume-size 50 \
  --security-groups <SECURITY_GROUP_ID>
```

If you created an Ignition file, include the additional `--user-data @/path/to/your/ignition.json` flag.  
Make sure to use the `@` prefix, which tells the CLI to load the contents of your Ignition file.

After running the command, copy the server ID from the output.

### 2. Create and Attach a Public IP
Then, attach the IP to your server:
```shell
stackit server public-ip attach <PUBLIC_IP_ID> --server-id <SERVER_ID> --project-id <PROJECT_ID>
```

### 3. Connect to Your Server
Your Flatcar server is running and your public IP address is attached.  
You can now connect to it via SSH using the user core and your private SSH key.
```shell
ssh core@<PUBLIC_IP_ADDRESS> -i ~/.ssh/<SSH_PRIVATE_KEY_NAME>
```

### 4. (Optional) Verify Your Nginx Configuration
If you configured the server with the example Butane file to run an Nginx container, you can verify that it's working after you have connected via SSH.

Run the `curl` command to check the local web server:
```shell
curl localhost
```

This confirms your User Data script was executed successfully. You should see a "Hello" message from the container, which includes the server's unique hostname:
```shell
Hello from <HOSTNAME>
```
