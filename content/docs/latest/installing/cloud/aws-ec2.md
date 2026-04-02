---
title: Running Flatcar Container Linux on AWS EC2
linktitle: Running on AWS EC2
weight: 10
aliases:
    - ../../os/booting-on-ec2
    - ../../cloud-providers/booting-on-ec2
---

The current AMIs for all Flatcar Container Linux channels and EC2 regions are listed below and updated frequently. Using CloudFormation is the easiest way to launch a cluster, but it is also possible to follow the manual steps at the end of the article. Questions can be directed to the Flatcar Container Linux [Matrix channel][matrix] or [user mailing list][flatcar-user].

At the end of the document there are instructions for deploying with Terraform.

## Release retention time

After publishing, releases will remain available as public AMIs on AWS for 9 months. AMIs older than 9 months will be un-published in regular garbage collection sweeps. Please note that this will not impact existing AWS instances that use those releases. However, deploying new instances (e.g. in autoscaling groups pinned to a specific AMI) will not be possible after the AMI was un-published.

## Choosing a channel

Flatcar Container Linux is designed to be updated automatically with different schedules per channel. You can [disable this feature][update-strategies], although we don't recommend it. Read the [release notes][release-notes] for specific features and bug fixes.

<div id="ec2-images">
  <ul class="nav nav-tabs">
    <li class="active"><a href="#stable" data-bs-toggle="tab">Stable Channel</a></li>
    <li><a href="#beta" data-bs-toggle="tab">Beta Channel</a></li>
    <li><a href="#alpha" data-bs-toggle="tab">Alpha Channel</a></li>
    <li><a href="#lts" data-bs-toggle="tab">LTS Channel</a></li>
  </ul>
  <div class="tab-content coreos-docs-image-table">
    <div class="tab-pane active" id="stable">
      <div class="channel-info">
        <p>The Stable channel should be used by production clusters. Versions of Flatcar Container Linux are battle-tested within the Beta and Alpha channels before being promoted. The current version is Flatcar Container Linux {{< param stable_channel >}}.</p>
        View as json feed: {{< docs_amis_feed "stable" >}}
      </div>
      {{< docs_amis_table "stable" >}}
    </div>
    <div class="tab-pane" id="beta">
      <div class="channel-info">
        <p>The Beta channel consists of promoted Alpha releases. The current version is Flatcar Container Linux {{< param beta_channel >}}.</p>
        View as json feed: {{< docs_amis_feed "beta" >}}
      </div>
      {{< docs_amis_table "beta" >}}
    </div>
    <div class="tab-pane" id="alpha">
      <div class="channel-info">
        <p>The Alpha channel closely tracks master and is released frequently. The newest versions of system libraries and utilities will be available for testing. The current version is Flatcar Container Linux {{< param alpha_channel >}}.</p>
        View as json feed: {{< docs_amis_feed "alpha" >}}
      </div>
      {{< docs_amis_table "alpha" >}}
    </div>
    <div class="tab-pane active" id="lts">
      <div class="channel-info">
        <p>LTS release streams are maintained for an extended lifetime of 18 months. The yearly LTS streams have an overlap of 6 months. The current version is Flatcar Container Linux {{< param lts_channel >}}.</p>
        View as json feed: {{< docs_amis_feed "lts" >}}
      </div>
      {{< docs_amis_table "lts" >}}
    </div>
  </div>
</div>


## Butane Configs

Flatcar Container Linux allows you to configure machine parameters, configure networking, launch systemd units on startup, and more via Butane Configs. These configs are then transpiled into Ignition configs and given to booting machines. Head over to the [docs to learn about the supported features][butane-configs].

You can provide a raw Ignition JSON config to Flatcar Container Linux via the Amazon web console or [via the EC2 API][ec2-user-data].

As an example, this Butane YAML config will start an NGINX Docker container:

```yaml
variant: flatcar
version: 1.0.0
systemd:
  units:
    - name: nginx.service
      enabled: true
      contents: |
        [Unit]
        Description=NGINX example
        After=docker.service
        Requires=docker.service
        [Service]
        TimeoutStartSec=0
        ExecStartPre=-/usr/bin/docker rm --force nginx1
        ExecStart=/usr/bin/docker run --name nginx1 --pull always --log-driver=journald --net host docker.io/nginx:1
        ExecStop=/usr/bin/docker stop nginx1
        Restart=always
        RestartSec=5s
        [Install]
        WantedBy=multi-user.target
```

Transpile it to Ignition JSON:

```shell
cat cl.yaml | docker run --rm -i quay.io/coreos/butane:latest > ignition.json
```

### Instance storage

Ephemeral disks and additional EBS volumes attached to instances can be mounted with a `.mount` unit. Amazon's block storage devices are attached differently [depending on the instance type](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/InstanceStorage.html#InstanceStoreDeviceNames). Here's the Butane Config to format and mount the first ephemeral disk, `xvdb`, on most instance types:

```yaml
variant: flatcar
version: 1.0.0
storage:
  filesystems:
    - device: /dev/xvdb
      format: ext4
      wipe_filesystem: true
      label: ephemeral
systemd:
  units:
    - name: media-ephemeral.mount
      enabled: true
      contents: |
        [Mount]
        What=/dev/disk/by-label/ephemeral
        Where=/media/ephemeral
        Type=ext4

        [Install]
        RequiredBy=local-fs.target
```

For more information about mounting storage, Amazon's [own documentation](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/InstanceStorage.html) is the best source. You can also read about [mounting storage on Flatcar Container Linux](../../setup/storage/mounting-storage).

### Adding more machines

To add more instances to the cluster, just launch more with the same Butane Config, the appropriate security group and the AMI for that region. New instances will join the cluster regardless of region if the security groups are configured correctly.

## SSH to your instances

Flatcar Container Linux is set up to be a little more secure than other cloud images. By default, it uses the `core` user instead of `root` and doesn't use a password for authentication. You'll need to add an SSH key(s) via the AWS console or add keys/passwords via your Butane Config in order to log in.

To connect to an instance after it's created, run:

```shell
ssh core@<ip address>
```

## Multiple clusters

If you would like to create multiple clusters you will need to change the "Stack Name". You can find the direct [template file on S3](https://flatcar-prod-ami-import-eu-central-1.s3.amazonaws.com/dist/aws/flatcar-stable-hvm.template).

## Manual setup

**TL;DR:** launch three instances of [{{< docs_amis_get_hvm "alpha" "us-east-1" >}}](https://console.aws.amazon.com/ec2/home?region=us-east-1#launchAmi={{< docs_amis_get_hvm "alpha" "us-east-1" >}}) (amd64) in **us-east-1** with a security group that has open port 22, 2379, 2380, 4001, and 7001 and the same "User Data" of each host. SSH uses the `core` user and you have [etcd][etcd-docs] and [Docker][docker-docs] to play with.

### Creating the security group

You need open port 2379, 2380, 7001 and 4001 between servers in the `etcd` cluster. Step by step instructions below.

Note: _This step is only needed once_

First we need to create a security group to allow Flatcar Container Linux instances to communicate with one another.

1. Go to the [security group][sg] page in the EC2 console.
2. Click "Create Security Group"
    * Name: flatcar-testing
    * Description: Flatcar Container Linux instances
    * VPC: No VPC
    * Click: "Yes, Create"
3. In the details of the security group, click the `Inbound` tab
4. First, create a security group rule for SSH
    * Create a new rule: `SSH`
    * Source: 0.0.0.0/0
    * Click: "Add Rule"
5. Add two security group rules for etcd communication
    * Create a new rule: `Custom TCP rule`
    * Port range: 2379
    * Source: type "flatcar-testing" until your security group auto-completes. Should be something like "sg-8d4feabc"
    * Click: "Add Rule"
    * Repeat this process for port range 2380, 4001 and 7001 as well
6. Click "Apply Rule Changes"

[sg]: https://console.aws.amazon.com/ec2/home?region=us-east-1#s=SecurityGroups

### Launching a test cluster

We will be launching three instances, with a few parameters in the User Data, and selecting our security group.

- Open the quick launch wizard to boot: <a href="https://console.aws.amazon.com/ec2/home?region=us-east-1#launchAmi={{< docs_amis_get_hvm "alpha" "us-east-1" >}}" target="_blank">Alpha {{< docs_amis_get_hvm "alpha" "us-east-1" >}} (amd64)</a>, <a href="https://console.aws.amazon.com/ec2/home?region=us-east-1#launchAmi={{< docs_amis_get_hvm "beta" "us-east-1" >}}" target="_blank">Beta {{< docs_amis_get_hvm "beta" "us-east-1" >}} (amd64)</a>, or <a href="https://console.aws.amazon.com/ec2/home?region=us-east-1#launchAmi={{< docs_amis_get_hvm "stable" "us-east-1" >}}" target="_blank">Stable {{< docs_amis_get_hvm "stable" "us-east-1" >}} (amd64)</a>
- On the second page of the wizard, launch 3 servers to test our clustering
  - Number of instances: 3,  "Continue"
- Paste your Ignition JSON config in the EC2 dashboard into the "User Data" field, "Continue"
- Storage Configuration, "Continue"
- Tags, "Continue"
- Create Key Pair: Choose a key of your choice, it will be added in addition to the one in the gist, "Continue"
- Choose one or more of your existing Security Groups: "flatcar-testing" as above, "Continue"
- Launch!

## Installation from a VMDK image

One of the possible ways of installation is to import the generated VMDK Flatcar image as a snapshot. The image file will be in `https://${CHANNEL}.release.flatcar-linux.net/${ARCH}-usr/${VERSION}/flatcar_production_ami_vmdk_image.vmdk.bz2`.
Make sure you download the signature (it's available in `https://${CHANNEL}.release.flatcar-linux.net/${ARCH}-usr/${VERSION}/flatcar_production_ami_vmdk_image.vmdk.bz2.sig`) and check it before proceeding.

```shell
$ wget https://alpha.release.flatcar-linux.net/amd64-usr/current/flatcar_production_ami_vmdk_image.vmdk.bz2
$ wget https://alpha.release.flatcar-linux.net/amd64-usr/current/flatcar_production_ami_vmdk_image.vmdk.bz2.sig
$ gpg --verify flatcar_production_ami_vmdk_image.vmdk.bz2.sig
gpg: assuming signed data in 'flatcar_production_ami_vmdk_image.vmdk.bz2'
gpg: Signature made Thu 15 Mar 2018 10:27:57 AM CET
gpg:                using RSA key A621F1DA96C93C639506832D603443A1D0FC498C
gpg: Good signature from "Flatcar Buildbot (Official Builds) <buildbot@flatcar-linux.org>" [ultimate]
```

Then, follow the instructions in [Importing a Disk as a Snapshot Using VM Import/Export](https://docs.aws.amazon.com/vm-import/latest/userguide/vmimport-import-snapshot.html). You'll need to upload the uncompressed vmdk file to S3.

After the snapshot is imported, you can go to "Snapshots" in the EC2 dashboard, and generate an AMI image from it.
To make it work, use `/dev/sda2` as the "Root device name" and you probably want to select "Hardware-assisted virtualization" as "Virtualization type".

## Using Flatcar Container Linux

Now that you have a machine booted it is time to play around. Check out the [Flatcar Container Linux Quickstart][quickstart] guide or dig into [more specific topics][doc-index].

## Terraform

The [`aws`](https://registry.terraform.io/providers/hashicorp/aws/latest/docs) Terraform Provider allows to deploy machines in a declarative way.
Read more about using Terraform and Flatcar [here](../../provisioning/terraform/).

The following Terraform v0.13 module may serve as a base for your own setup.
It will also take care of registering your SSH key at AWS EC2 and managing the network environment with Terraform.

You can clone the setup from the [Flatcar Terraform examples repository](https://github.com/flatcar/flatcar-terraform/tree/main/aws) or create the files manually as we go through them and explain each one.

```
git clone https://github.com/flatcar/flatcar-terraform.git
# From here on you could directly run it, TLDR:
cd aws
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
terraform init
# Edit the server configs or just go ahead with the default example
terraform plan
terraform apply
```

Start with a `aws-ec2-machines.tf` file that contains the main declarations:

```
terraform {
  required_version = ">= 0.13"
  required_providers {
    ct = {
      source  = "poseidon/ct"
      version = "0.7.1"
    }
    template = {
      source  = "hashicorp/template"
      version = "~> 2.2.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.19.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_vpc" "network" {
  cidr_block = var.vpc_cidr

  tags = {
    Name = var.cluster_name
  }
}

resource "aws_subnet" "subnet" {
  vpc_id     = aws_vpc.network.id
  cidr_block = var.subnet_cidr

  tags = {
    Name = var.cluster_name
  }
}

resource "aws_internet_gateway" "gateway" {
  vpc_id = aws_vpc.network.id

  tags = {
    Name = var.cluster_name
  }
}

resource "aws_route_table" "default" {
  vpc_id = aws_vpc.network.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gateway.id
  }

  tags = {
    Name = var.cluster_name
  }
}

resource "aws_route_table_association" "public" {
  route_table_id = aws_route_table.default.id
  subnet_id      = aws_subnet.subnet.id
}

resource "aws_security_group" "securitygroup" {
  vpc_id = aws_vpc.network.id

  tags = {
    Name = var.cluster_name
  }
}

resource "aws_security_group_rule" "outgoing_any" {
  security_group_id = aws_security_group.securitygroup.id
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "incoming_any" {
  security_group_id = aws_security_group.securitygroup.id
  type              = "ingress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_key_pair" "ssh" {
  key_name   = var.cluster_name
  public_key = var.ssh_keys.0
}

data "aws_ami" "flatcar_stable_latest" {
  most_recent = true
  owners      = ["aws-marketplace"]

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "name"
    values = ["Flatcar-stable-*"]
  }
}

resource "aws_instance" "machine" {
  for_each      = toset(var.machines)
  instance_type = var.instance_type
  user_data     = data.ct_config.machine-ignitions[each.key].rendered
  ami           = data.aws_ami.flatcar_stable_latest.image_id
  key_name      = aws_key_pair.ssh.key_name

  associate_public_ip_address = true
  subnet_id                   = aws_subnet.subnet.id
  vpc_security_group_ids      = [aws_security_group.securitygroup.id]

  tags = {
    Name = "${var.cluster_name}-${each.key}"
  }
}

data "ct_config" "machine-ignitions" {
  for_each = toset(var.machines)
  content  = data.template_file.machine-configs[each.key].rendered
}

data "template_file" "machine-configs" {
  for_each = toset(var.machines)
  template = file("${path.module}/cl/machine-${each.key}.yaml.tmpl")

  vars = {
    ssh_keys = jsonencode(var.ssh_keys)
    name     = each.key
  }
}
```

Create a `variables.tf` file that declares the variables used above:

```
variable "machines" {
  type        = list(string)
  description = "Machine names, corresponding to cl/machine-NAME.yaml.tmpl files"
}

variable "cluster_name" {
  type        = string
  description = "Cluster name used as prefix for the machine names"
}

variable "ssh_keys" {
  type        = list(string)
  description = "SSH public keys for user 'core'"
}

variable "aws_region" {
  type        = string
  default     = "us-east-2"
  description = "AWS Region to use for running the machine"
}

variable "instance_type" {
  type        = string
  default     = "t3.medium"
  description = "Instance type for the machine"
}

variable "vpc_cidr" {
  type    = string
  default = "172.16.0.0/16"
}

variable "subnet_cidr" {
  type    = string
  default = "172.16.10.0/24"
}
```

An `outputs.tf` file shows the resulting IP addresses:

```
output "ip-addresses" {
  value = {
    for key in var.machines :
    "${var.cluster_name}-${key}" => aws_instance.machine[key].public_ip
  }
}
```

Now you can use the module by declaring the variables and a Container Linux Configuration for a machine.
First create a `terraform.tfvars` file with your settings:

```
cluster_name           = "mycluster"
machines               = ["mynode"]
ssh_keys               = ["ssh-rsa AA... me@mail.net"]
```

The machine name listed in the `machines` variable is used to retrieve the corresponding [Container Linux Config](https://www.flatcar.org/docs/latest/provisioning/cl-config/).
For each machine in the list, you should have a `machine-NAME.yaml.tmpl` file with a corresponding name.

For example, create the configuration for `mynode` in the file `machine-mynode.yaml.tmpl` (The SSH key used there is not really necessary since we already set it as VM attribute):

```yaml
---
passwd:
  users:
    - name: core
      ssh_authorized_keys:
        - ${ssh_keys}
storage:
  files:
    - path: /home/core/works
      filesystem: root
      mode: 0755
      contents:
        inline: |
          #!/bin/bash
          set -euo pipefail
           # This script demonstrates how templating and variable substitution works when using Terraform templates for Container Linux Configs.
          hostname="$(hostname)"
          echo My name is ${name} and the hostname is $${hostname}
```

Finally, run Terraform v0.13 as follows to create the machine:

```
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
terraform init
terraform apply
```

Log in via `ssh core@IPADDRESS` with the printed IP address (maybe add `-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`).

When you make a change to `machine-mynode.yaml.tmpl` and run `terraform apply` again, the machine will be replaced.

You can find this Terraform module in the repository for [Flatcar Terraform examples](https://github.com/flatcar/flatcar-terraform/tree/main/aws).

## Amazon EKS

To use Flatcar Container Linux with Amazon Elastic Kubernetes Service (EKS), several items must be in your Butane configuration:

* The Amazon EKS Kubelet binary
* The CA Certificate of your EKS cluster (used for cluster authentication)
* The awscli tool
* The ECR credential provider (required to pull EKS-managed images like kube-proxy)

Flatcar Container Linux nodes will also need everything any EKS [self-managed node requires](https://docs.aws.amazon.com/eks/latest/userguide/worker.html): the correct IAM roles, proper security group connectivity, proper tags, etc.

A complete Butane example for a Flatcar Container Linux EKS node is provided below: 

```yaml
variant: flatcar
version: 1.0.0

storage:
  directories:
    - path: /opt/bin
      mode: 0755
    - path: /etc/kubernetes/pki
      mode: 0700
    - path: /var/lib/kubelet
      mode: 0700

  files:
     # ---- Kernel parameters required by kubelet ----
    - path: /etc/sysctl.d/90-kubernetes.conf
      mode: 0644
      contents:
        inline: |
          vm.overcommit_memory = 1
          kernel.panic = 10

    # ---- Install AWS CLI v2 ----
    - path: /opt/bin/install-deps.sh
      mode: 0755
      contents:
        inline: |
          #!/bin/bash
          set -euo pipefail

          # AWS CLI v2
          if [ ! -f /opt/bin/aws ]; then
            curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" \
              -o /tmp/awscliv2.zip
            unzip -q /tmp/awscliv2.zip -d /tmp/
            /tmp/aws/install --install-dir /opt/aws/cli --bin-dir /opt/bin
            rm -rf /tmp/aws /tmp/awscliv2.zip
          fi

          # EKS-patched kubelet (must use EKS build, not upstream, for v1beta1 exec credential support)
          if [ ! -f /opt/bin/kubelet ]; then
            curl -fsSL \
              "https://s3.us-west-2.amazonaws.com/amazon-eks/${K8S_VERSION}/${eks_release_date}/bin/linux/amd64/kubelet" \
              -o /opt/bin/kubelet
            chmod +x /opt/bin/kubelet
          fi

          # ECR credential provider (required to pull EKS-managed images like kube-proxy)
          if [ ! -f /opt/bin/ecr-credential-provider ]; then
            curl -fsSL \
              "https://s3.us-west-2.amazonaws.com/amazon-eks/${K8S_VERSION}/${eks_release_date}/bin/linux/amd64/ecr-credential-provider" \
              -o /opt/bin/ecr-credential-provider
            chmod +x /opt/bin/ecr-credential-provider
          fi

    # ---- ECR credential provider config (matches AL2023 nodeadm format) ----
    - path: /etc/eks/image-credential-provider/config.json
      mode: 0644
      contents:
        inline: |
          {
            "apiVersion": "kubelet.config.k8s.io/v1",
            "kind": "CredentialProviderConfig",
            "providers": [
              {
                "name": "ecr-credential-provider",
                "matchImages": [
                  "*.dkr.ecr.*.amazonaws.com",
                  "*.dkr.ecr.*.amazonaws.com.cn",
                  "*.dkr.ecr-fips.*.amazonaws.com",
                  "*.dkr.ecr.us-iso-east-1.c2s.ic.gov",
                  "*.dkr.ecr.us-isob-east-1.sc2s.sgov.gov"
                ],
                "defaultCacheDuration": "12h",
                "apiVersion": "credentialprovider.kubelet.k8s.io/v1"
              }
            ]
          }

    # ---- Bootstrap: writes kubeconfig + kubelet-config ----
    - path: /opt/bin/bootstrap-eks.sh
      mode: 0755
      contents:
        inline: |
          #!/bin/bash
          set -euo pipefail

          # IMDSv2
          TOKEN=$(curl -sf -X PUT "http://169.254.169.254/latest/api/token" \
            -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")

          # Node hostname (EKS uses private DNS as node name)
          PRIVATE_DNS=$(curl -sf \
            -H "X-aws-ec2-metadata-token: $TOKEN" \
            http://169.254.169.254/latest/meta-data/hostname)

          # AZ + instance ID for provider-id (required for EKS cloud controller
          # to initialize the node and remove the 'uninitialized' taint)
          AZ=$(curl -sf \
            -H "X-aws-ec2-metadata-token: $TOKEN" \
            http://169.254.169.254/latest/meta-data/placement/availability-zone)
          INSTANCE_ID=$(curl -sf \
            -H "X-aws-ec2-metadata-token: $TOKEN" \
            http://169.254.169.254/latest/meta-data/instance-id)

          # Kubeconfig with exec-based auth
          cat > /etc/kubernetes/kubeconfig <<EOF
          apiVersion: v1
          kind: Config
          clusters:
          - cluster:
              certificate-authority: /etc/kubernetes/pki/ca.crt
              server: ${cluster_endpoint}
            name: kubernetes
          contexts:
          - context:
              cluster: kubernetes
              user: kubelet
            name: kubelet
          current-context: kubelet
          users:
          - name: kubelet
            user:
              exec:
                apiVersion: client.authentication.k8s.io/v1beta1
                command: /opt/bin/aws
                args:
                  - eks
                  - get-token
                  - --cluster-name
                  - ${cluster_name}
                  - --region
                  - ${aws_region}
          EOF
          chmod 600 /etc/kubernetes/kubeconfig

          # Decode cluster CA for kubelet TLS verification
          echo "${cluster_ca}" | base64 -d > /etc/kubernetes/pki/ca.crt

          # kubelet configuration
          cat > /etc/kubernetes/kubelet-config.yaml <<EOF
          apiVersion: kubelet.config.k8s.io/v1beta1
          kind: KubeletConfiguration
          address: 0.0.0.0
          authentication:
            anonymous:
              enabled: false
            webhook:
              enabled: true
              cacheTTL: 2m
            x509:
              clientCAFile: /etc/kubernetes/pki/ca.crt
          authorization:
            mode: Webhook
          clusterDNS:
            - 172.20.0.10
          clusterDomain: cluster.local
          cgroupDriver: systemd
          containerRuntimeEndpoint: unix:///run/containerd/containerd.sock
          featureGates:
            RotateKubeletServerCertificate: true
          protectKernelDefaults: true
          serializeImagePulls: false
          serverTLSBootstrap: true
          EOF

          cat > /etc/kubernetes/node-hostname <<ENVEOF
          NODE_HOSTNAME=$PRIVATE_DNS
          PROVIDER_ID=aws:///$AZ/$INSTANCE_ID
          ENVEOF

    # ---- kubelet wrapper: sources node-hostname env file at runtime ----
    - path: /opt/bin/start-kubelet.sh
      mode: 0755
      contents:
        inline: |
          #!/bin/bash
          set -euo pipefail
          . /etc/kubernetes/node-hostname
          exec /opt/bin/kubelet \
            --config=/etc/kubernetes/kubelet-config.yaml \
            --kubeconfig=/etc/kubernetes/kubeconfig \
            --cloud-provider=external \
            --provider-id="$PROVIDER_ID" \
            --hostname-override="$NODE_HOSTNAME" \
            --image-credential-provider-bin-dir=/opt/bin \
            --image-credential-provider-config=/etc/eks/image-credential-provider/config.json \
            --node-labels=eks.amazonaws.com/nodegroup=${nodegroup_name},eks.amazonaws.com/compute-type=ec2 \
            --v=2

    # ---- containerd: configure pause image + systemd cgroup ----
    - path: /etc/containerd/config.toml
      overwrite: true
      contents:
        inline: |
          version = 2

          [plugins."io.containerd.grpc.v1.cri"]
            sandbox_image = "${pause_image}"

            [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
              runtime_type = "io.containerd.runc.v2"

              [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
                SystemdCgroup = true

systemd:
  units:
    # Pin version — disable auto-update and locksmith reboot coordinator
    - name: update-engine.service
      mask: true
    - name: locksmithd.service
      mask: true

    - name: install-deps.service
      enabled: true
      contents: |
        [Unit]
        Description=Install AWS CLI and kubelet
        After=network-online.target
        Wants=network-online.target
        ConditionPathExists=!/opt/bin/kubelet

        [Service]
        Type=oneshot
        RemainAfterExit=yes
        Environment=K8S_VERSION=${K8S_VERSION}
        ExecStart=/opt/bin/install-deps.sh

        [Install]
        WantedBy=multi-user.target

    - name: bootstrap-eks.service
      enabled: true
      contents: |
        [Unit]
        Description=Bootstrap EKS node
        After=install-deps.service network-online.target
        Requires=install-deps.service
        ConditionPathExists=!/etc/kubernetes/kubeconfig

        [Service]
        Type=oneshot
        RemainAfterExit=yes
        ExecStart=/opt/bin/bootstrap-eks.sh

        [Install]
        WantedBy=multi-user.target

    - name: kubelet.service
      enabled: true
      contents: |
        [Unit]
        Description=Kubernetes Kubelet
        After=bootstrap-eks.service containerd.service
        Requires=containerd.service
        Wants=bootstrap-eks.service

        [Service]
        Restart=always
        RestartSec=5
        ExecStart=/opt/bin/start-kubelet.sh
        ExecStartPre=/bin/bash -c "until [ -f /etc/kubernetes/kubeconfig ] && [ -f /etc/kubernetes/node-hostname ]; do sleep 2; done"

        [Install]
        WantedBy=multi-user.target
```

[quickstart]: ../
[doc-index]: ../../
[flatcar-user]: https://groups.google.com/forum/#!forum/flatcar-linux-user
[docker-docs]: https://docs.docker.io
[etcd-docs]: https://etcd.io/docs
[update-strategies]: ../../setup/releases/update-strategies
[matrix]: https://app.element.io/#/room/#flatcar:matrix.org
[release-notes]: https://flatcar-linux.org/releases
[ec2-user-data]: http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html
[butane-configs]: ../../provisioning/config-transpiler
