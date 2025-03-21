---
title: Running Flatcar Container Linux on Microsoft Azure
linktitle: Running on Microsoft Azure
weight: 10
aliases:
    - ../../os/booting-on-azure
    - ../../cloud-providers/booting-on-azure
---

## Creating resource group via Microsoft Azure CLI

Follow the [installation and configuration guides][azure-cli] for the Microsoft Azure CLI to set up your local installation.

Instances on Microsoft Azure must be created within a resource group. Create a new resource group with the following command:

```shell
az group create --name group-1 --location <location>
```

Now that you have a resource group, you can choose a channel of Flatcar Container Linux you would like to install.

## Using the official image from the Marketplace

Official Flatcar Container Linux images for all channels are available in the Marketplace.
Flatcar is published by the `kinvolk` publisher on Marketplace.
Flatcar Container Linux is designed to be [updated automatically][update-docs] with different schedules per channel. Updating
can be [disabled][reboot-docs], although it is not recommended to do so. The [release notes][release-notes] contain
information about specific features and bug fixes.

The following command will create a single instance through the Azure CLI.

<div id="azure-images">
  <ul class="nav nav-tabs">
    <li class="active"><a href="#stable" data-toggle="tab">Stable Channel</a></li>
    <li><a href="#beta" data-toggle="tab">Beta Channel</a></li>
    <li><a href="#alpha" data-toggle="tab">Alpha Channel</a></li>
  </ul>
  <div class="tab-content coreos-docs-image-table">
    <div class="tab-pane active" id="stable">
      <div class="channel-info">
        <p>The Stable channel should be used by production clusters. Versions of Flatcar Container Linux are battle-tested within
        the Beta and Alpha channels before being promoted. The current version is Flatcar Container Linux {{< param stable_channel >}}.</p>
        <pre>
$ az vm image list --all -p kinvolk -f flatcar -s stable-gen2 --query '[-1]'  # Query the image name urn specifier
{
  "architecture": "x64",
  "offer": "flatcar-container-linux-free",
  "publisher": "kinvolk",
  "sku": "stable-gen2",
  "urn": "kinvolk:flatcar-container-linux-free:stable-gen2:3815.2.0",
  "version": "3815.2.0"
}
$ az vm create --name node-1 --resource-group group-1 --admin-username core --user-data config.ign --image kinvolk:flatcar-container-linux-free:stable-gen2:3815.2.0
        </pre>
      </div>
    </div>
    <div class="tab-pane" id="beta">
      <div class="channel-info">
        <p>The Beta channel consists of promoted Alpha releases. The current version is Flatcar Container Linux {{< param beta_channel >}}.</p>
        <pre>
$ az vm image list --all -p kinvolk -f flatcar -s beta-gen2 --query '[-1]'  # Query the image name urn specifier
{
  "architecture": "x64",
  "offer": "flatcar-container-linux-free",
  "publisher": "kinvolk",
  "sku": "beta-gen2",
  "urn": "kinvolk:flatcar-container-linux-free:beta-gen2:3850.1.0",
  "version": "3850.1.0"
}
$ az vm create --name node-1 --resource-group group-1 --admin-username core --user-data config.ign --image kinvolk:flatcar-container-linux-free:beta-gen2:3850.1.0
        </pre>
      </div>
    </div>
    <div class="tab-pane" id="alpha">
      <div class="channel-info">
        <p>The Alpha channel closely tracks the master branch and is released frequently. The newest versions of system
        libraries and utilities are available for testing in this channel. The current version is Flatcar Container Linux {{< param alpha_channel >}}.</p>
        <pre>
$ az vm image list --all -p kinvolk -f flatcar -s alpha-gen2 --query '[-1]'
{
  "architecture": "x64",
  "offer": "flatcar-container-linux-free",
  "publisher": "kinvolk",
  "sku": "alpha-gen2",
  "urn": "kinvolk:flatcar-container-linux-free:alpha-gen2:3874.0.0",
  "version": "3874.0.0"
}
$ az vm create --name node-1 --resource-group group-1 --admin-username core --user-data config.ign --image kinvolk:flatcar-container-linux-free:alpha-gen2:3874.0.0
        </pre>
      </div>
    </div>
  </div>
</div>

Use the offer named `flatcar-container-linux-free`, there is also a legacy offer called `flatcar-container-linux` with the same contents.
The SKU, which is the third element of the image URN, relates to one of the release channels and also depends on whether to use Hyper-V Generation 1 or 2 VM.
Generation 2 instance types use UEFI boot and should be preferred, the SKU matches the pattern `<channel>-gen`: `alpha-gen2`, `beta-gen2` or `stable-gen2`.
For Generation 1 instance types drop the `-gen2` from the SKU: `alpha`, `beta` or `stable`.  
Note: _`az vm image list -s` flag matches parts of the SKU, which means that `-s stable` will return both the `stable` and `stable-gen2` SKUs._

Before being able to use the offers, you may need to accept the legal terms once, here done for `flatcar-container-linux-free` and `stable-gen2`:

```shell
az vm image terms show --publish kinvolk --offer flatcar-container-linux-free --plan stable-gen2
az vm image terms accept --publish kinvolk --offer flatcar-container-linux-free --plan stable-gen2
```

For quick tests the official Azure CLI also supports an alias for the latest Flatcar stable image:
```shell
az vm create --name node-1 --resource-group group-1 --admin-username core --user-data config.ign --image FlatcarLinuxFreeGen2
```

### CoreVM

Flatcar images are also published under an offer called `flatcar-container-linux-corevm-amd64`. This offer does not require accepting image terms and does not require specifying plan information when creating instances or building derived images. The content of the images matches the other offers.
```shell
$ az vm image list --all -p kinvolk -f flatcar-container-linux-corevm-amd64 -s stable-gen2 --query '[-1]'
{
  "architecture": "x64",
  "offer": "flatcar-container-linux-corevm-amd64",
  "publisher": "kinvolk",
  "sku": "stable-gen2",
  "urn": "kinvolk:flatcar-container-linux-corevm-amd64:stable-gen2:3815.2.0",
  "version": "3815.2.0"
}
```

### ARM64
Arm64 images are published under the offer called `flatcar-container-linux-corevm`. These are Generation 2 images, the only supported option on Azure for Arm64 instances, so the SKU contains only the release channel name without the `-gen2` suffix: `alpha`, `beta`, `stable`. This offer has the same properties as the `CoreVM` offer described above.
```shell
$ az vm image list --all --architecture arm64 -p kinvolk -f flatcar -s stable --query '[-1]'
{
  "architecture": "Arm64",
  "offer": "flatcar-container-linux-corevm",
  "publisher": "kinvolk",
  "sku": "stable",
  "urn": "kinvolk:flatcar-container-linux-corevm:stable:3815.2.0",
  "version": "3815.2.0"
}
```

### Flatcar Pro Images

Flatcar Pro images were paid marketplace images that came with commercial support and extra features. All the previous features of Flatcar Pro images, such as support for NVIDIA GPUs, are now available to all users in standard Flatcar marketplace images.

### Plan information for building your image from the Marketplace Image

When building an image based on the Marketplace image you sometimes need to specify the original plan. The plan name is the image SKU, e.g., `stable`, the plan product is the image offer, e.g., `flatcar-container-linux-free`, and the plan publisher is the same (`kinvolk`).

## Community Shared Image Gallery

While the Marketplace images are recommended, it sometimes might be easier or required to use Shared Image Galleries, e.g., when using Packer for Kubernetes CAPI images.

A public Shared Image Gallery hosts recent Flatcar Stable images for amd64. Here is how to show the image definitions (for now you will only find `flatcar-stable-amd64`) and the image versions they provide:

```shell
az sig image-definition list-community --public-gallery-name flatcar-23485951-527a-48d6-9d11-6931ff0afc2e --location westeurope
az sig image-version list-community --public-gallery-name flatcar-23485951-527a-48d6-9d11-6931ff0afc2e --gallery-image-definition flatcar-stable-amd64 --location westeurope
```

A second gallery `flatcar4capi-742ef0cb-dcaa-4ecb-9cb0-bfd2e43dccc0` exists for prebuilt Kubernetes CAPI images. It has image definitions for each CAPI version, e.g., `flatcar-stable-amd64-capi-v1.26.3` which provides recent Flatcar Stable versions.

## Uploading your own Image

To automatically download the Flatcar image for Azure from the release page and upload it to your Azure account, run the following command:

```shell
docker run -it --rm quay.io/kinvolk/azure-flatcar-image-upload \
  --resource-group <resource group> \
  --storage-account-name <storage account name>
```

Where:

- `<resource group>` should be a valid [Resource Group][resource-group] name.
- `<storage account name>` should be a valid [Storage Account][storage-account] name.

During execution, the script will ask you to log into your Azure account and then create all necessary resources for
uploading an image. It will then download the requested Flatcar Container Linux image and upload it to Azure.

If uploading fails with one of the following errors, it usually indicates a problem on Azure's side:

```text
Put https://mystorage.blob.core.windows.net/vhds?restype=container: dial tcp: lookup iago-dev.blob.core.windows.net on 80.58.61.250:53: no such host
```

```text
storage: service returned error: StatusCode=403, ErrorCode=AuthenticationFailed, ErrorMessage=Server failed to authenticate the request. Make sure the value of Authorization header is formed correctly including the signature. RequestId:a3ed1ebc-701e-010c-5258-0a2e84000000 Time:2019-05-14T13:26:00.1253383Z, RequestId=a3ed1ebc-701e-010c-5258-0a2e84000000, QueryParameterName=, QueryParameterValue=
```

The command is idempotent and it is therefore safe to re-run it in case of failure.

To see all available options, run:

```shell
docker run -it --rm quay.io/kinvolk/azure-flatcar-image-upload --help

Usage: /usr/local/bin/upload_images.sh [OPTION...]

 Required arguments:
  -g, --resource-group        Azure resource group.
  -s, --storage-account-name  Azure storage account name. Must be between 3 and 24 characters and unique within Azure.

 Optional arguments:
  -c, --channel              Flatcar Container Linux release channel. Defaults to 'stable'.
  -v, --version              Flatcar Container Linux version. Defaults to 'current'.
  -i, --image-name           Image name, which will be used later in Lokomotive configuration. Defaults to 'flatcar-<channel>'.
  -l, --location             Azure location to storage image. To list available locations run with '--locations'. Defaults to 'westeurope'.
  -S, --storage-account-type Type of storage account. Defaults to 'Standard_LRS'.
```

The Dockerfile for the `quay.io/kinvolk/azure-flatcar-image-upload` image is managed [here][azure-flatcar-image-upload].

## SSH User Setup

Azure offers to provision a user account and SSH key through the WAAgent daemon that runs by default.
In the web UI you can enter a user name for a new user and provide an SSH pub key to be set up.

On the CLI you can pass the user and the SSH key as follows:

```shell
az vm create ... --admin-username myuser --ssh-key-values ~/.ssh/id_rsa.pub
```

This also works for the `core` user.
If you plan to use the `core` user with an SSH key set up through Ignition userdata, the key argument here is not needed, and you can safely pass `--admin-username core` and no new user gets created.

## Butane Config

Flatcar Container Linux allows you to configure machine parameters, configure networking, launch systemd units on startup, and more
via a Butane Config. Head over to the [provisioning docs][butane-configs] to learn how to use Butane Configs.
Note that Microsoft Azure doesn't allow an instance's userdata to be modified after the instance had been launched. This
isn't a problem since Ignition, the tool that consumes the userdata, only runs on the first boot.

You can provide a raw Ignition JSON config (produced from a Butane Config) to Flatcar Container Linux via the Azure CLI using the `--custom-data` or `--user-data` flag
or in the web UI under _Custom Data_ or _User Data_.

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

Spawn a VM by passing the Ignition JSON in, and because the Ignition config didn't include the SSH keys, they are passed as VM metadata:

```
az vm create --name node-1 --resource-group group-1 --admin-username core --ssh-key-values ~/.ssh/id_rsa.pub --user-data ./ignition.json --image kinvolk:flatcar-container-linux:stable:3760.2.0
# Alternatively, instead of '--user-data ./ignition.json' you can use: --custom-data "$(cat ./ignition.json)"
```

## Use the Azure Hyper-V Host for time synchronisation instead of NTP

By default, Flatcar container Linux uses [`systemd-timesyncd`](https://www.freedesktop.org/software/systemd/man/systemd-timesyncd.service.html) for date and time synchronization, using an external NTP server as the source of accurate time.
Azure provides an alternative for accurate time - a [PTP](https://docs.microsoft.com/en-us/azure/virtual-machines/linux/time-sync) clock source that surfaces Azure Host time in Azure guest VMs.
Because Azure Host time is rigorously maintained with high precision, it’s a good source against which to synchronize guest time.
Unfortunately, systemd-timesyncd doesn’t support PTP clock sources, though there is an [upstream feature request](https://github.com/systemd/systemd/issues/22828) for adding this.
To work around this missing feature and to use Azure's PTP clock source, we can employ [`chrony`](https://chrony.tuxfamily.org/) in an [`alpine`](https://alpinelinux.org/) container to synchronise time.
Since alpine is relentlessly optimised for size, the container will merely take about 16MB of disk space.
Here's a configuration snippet to create a minimal chrony container during provisioning, and use it instead of systemd-timesyncd:

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /opt/chrony/Dockerfile
      mode: 0644
      contents:
        inline: |
          FROM alpine
          RUN apk add chrony
          RUN rm /etc/chrony/chrony.conf
    - path: /opt/chrony/chrony.conf
      mode: 0644
      contents:
        inline: |
          log statistics measurements tracking
          logdir /var/log/chrony
          driftfile /var/lib/chrony/drift
          makestep 1.0 3
          maxupdateskew 100.0
          dumpdir /var/lib/chrony
          rtcsync
          refclock PHC /dev/ptp0 poll 3 dpoll -2 offset 0 stratum 2
  directories:
    - path: /opt/chrony/logs
      mode: 0777
systemd:
  units:
    - name: systemd-timesyncd.service
      mask: true
    - name: prepare-chrony.service
      enabled: true
      contents: |
        [Unit]
        Description=Build the chrony container image
        ConditionPathExists=!/opt/chrony-build/done
        [Service]
        Type=oneshot
        RemainAfterExit=true
        Restart=on-failure
        WorkingDirectory=/opt/chrony
        ExecStart=/usr/bin/docker build -t chrony .
        ExecStartPost=/usr/bin/touch done
        [Install]
        WantedBy=multi-user.target
    - name: chrony.service
      enabled: true
      contents: |
        [Unit]
        Description=Chrony RTC time sync service
        After=docker.service prepare-chrony.service
        Requires=docker.service prepare-chrony.service
        [Service]
        TimeoutStartSec=0
        ExecStartPre=-/usr/bin/docker rm --force chrony
        ExecStart=/usr/bin/docker run --name chrony -i --cap-add=SYS_TIME -v /opt/chrony/logs:/var/log/chrony -v /opt/chrony/chrony.conf:/etc/chrony/chrony.conf --device=/dev/rtc:/dev/rtc --device=/dev/ptp_hyperv:/dev/ptp0 chrony chronyd -s -d
        ExecStop=/usr/bin/docker stop chrony
        Restart=always
        RestartSec=5s
        [Install]
        WantedBy=multi-user.target
```

If the above works for your use case without modifications or additions (i.e. there's no need to configure anything else) feel free to supply this ignition configuration as custom data for your deployments and call it a day:
```json
{
  "ignition": {
    "version": "3.3.0"
  },
  "storage": {
    "directories": [
      {
        "path": "/opt/chrony/logs",
        "mode": 511
      }
    ],
    "files": [
      {
        "path": "/opt/chrony/Dockerfile",
        "contents": {
          "compression": "",
          "source": "data:,FROM%20alpine%0ARUN%20apk%20add%20chrony%0ARUN%20rm%20%2Fetc%2Fchrony%2Fchrony.conf%0A"
        },
        "mode": 420
      },
      {
        "path": "/opt/chrony/chrony.conf",
        "contents": {
          "compression": "gzip",
          "source": "data:;base64,H4sIAAAAAAAC/0TMQW4DIQxG4b1P8V+ggSRH6KbLXsEFM0UDA7JN2ty+UhQ1q7f4pNfGBnP2al6ToQvbUulyuMGV016PjdrYclWEG2toYwvpW8dxp6y1eKlNnlK/nhIeQp13MZeJ8yniSp1/18zsYrv84BzjKVJefb7W/wNST3Y/EqmU1Eba8fnxjpDlFqbPiDlawxX50bcLRikmjghzZV8dF/oLAAD//xHNUSnZAAAA"
        },
        "mode": 420
      }
    ]
  },
  "systemd": {
    "units": [
      {
        "mask": true,
        "name": "systemd-timesyncd.service"
      },
      {
        "contents": "[Unit]\nDescription=Build the chrony container image\nConditionPathExists=!/opt/chrony-build/done\n[Service]\nType=oneshot\nRemainAfterExit=true\nRestart=on-failure\nWorkingDirectory=/opt/chrony\nExecStart=/usr/bin/docker build -t chrony .\nExecStartPost=/usr/bin/touch done\n[Install]\nWantedBy=multi-user.target\n",
        "enabled": true,
        "name": "prepare-chrony.service"
      },
      {
        "contents": "[Unit]\nDescription=Chrony RTC time sync service\nAfter=docker.service prepare-chrony.service\nRequires=docker.service prepare-chrony.service\n[Service]\nTimeoutStartSec=0\nExecStartPre=-/usr/bin/docker rm --force chrony\nExecStart=/usr/bin/docker run --name chrony -i --cap-add=SYS_TIME -v /opt/chrony/logs:/var/log/chrony -v /opt/chrony/chrony.conf:/etc/chrony/chrony.conf --device=/dev/rtc:/dev/rtc --device=/dev/ptp_hyperv:/dev/ptp0 chrony chronyd -s -d\nExecStop=/usr/bin/docker stop chrony\nRestart=always\nRestartSec=5s\n[Install]\nWantedBy=multi-user.target\n",
        "enabled": true,
        "name": "chrony.service"
      }
    ]
  }
}
```


## Using Flatcar Container Linux

For information on using Flatcar Container Linux check out the [Flatcar Container Linux quickstart guide][quickstart] or dive into [more specific topics][docs].

## Terraform

The [`azurerm`](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs) Terraform Provider allows to deploy machines in a declarative way.
Read more about using Terraform and Flatcar [here](../../provisioning/terraform/).

The following Terraform v0.13 module may serve as a base for your own setup.

You can clone the setup from the [Flatcar Terraform examples repository](https://github.com/flatcar/flatcar-terraform/tree/main/azure) or create the files manually as we go through them and explain each one.

```
git clone https://github.com/flatcar/flatcar-terraform.git
# From here on you could directly run it, TLDR:
cd azure
export ARM_SUBSCRIPTION_ID="<azure_subscription_id>"
export ARM_TENANT_ID="<azure_subscription_tenant_id>"
export ARM_CLIENT_ID="<service_principal_appid>"
terraform init
# Edit the server configs or just go ahead with the default example
terraform plan
terraform apply
```

Start with a `azure-vms.tf` file that contains the main declarations:

```
terraform {
  required_version = ">= 0.13"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>2.0"
    }
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
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "main" {
  name     = "${var.cluster_name}-rg"
  location = var.resource_group_location
}

resource "azurerm_virtual_network" "main" {
  name                = "${var.cluster_name}-network"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
}

resource "azurerm_subnet" "internal" {
  name                 = "internal"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.2.0/24"]
}

resource "azurerm_public_ip" "pip" {
  for_each            = toset(var.machines)
  name                = "${var.cluster_name}-${each.key}-pip"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  allocation_method   = "Dynamic"
}

resource "azurerm_network_interface" "main" {
  for_each            = toset(var.machines)
  name                = "${var.cluster_name}-${each.key}-nic"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.internal.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.pip[each.key].id
  }
}

resource "azurerm_linux_virtual_machine" "machine" {
  for_each            = toset(var.machines)
  name                = "${var.cluster_name}-${each.key}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  size                = var.server_type
  admin_username      = "core"
  custom_data         = base64encode(data.ct_config.machine-ignitions[each.key].rendered)
  network_interface_ids = [
    azurerm_network_interface.main[each.key].id,
  ]

  admin_ssh_key {
    username   = "core"
    public_key = var.ssh_keys.0
  }

  source_image_reference {
    publisher = "kinvolk"
    offer     = "flatcar-container-linux"
    sku       = "stable"
    version   = var.flatcar_stable_version
  }

  plan {
    name      = "stable"
    product   = "flatcar-container-linux"
    publisher = "kinvolk"
  }

  os_disk {
    storage_account_type = "Standard_LRS"
    caching              = "ReadWrite"
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
variable "resource_group_location" {
  default     = "eastus"
  description = "Location of the resource group."
}

variable "machines" {
  type        = list(string)
  description = "Machine names, corresponding to machine-NAME.yaml.tmpl files"
}

variable "cluster_name" {
  type        = string
  description = "Cluster name used as prefix for the machine names"
}

variable "ssh_keys" {
  type        = list(string)
  description = "SSH public keys for user 'core' (and to register directly with waagent for the first)"
}

variable "server_type" {
  type        = string
  default     = "Standard_D2s_v4"
  description = "The server type to rent"
}

variable "flatcar_stable_version" {
  type        = string
  description = "The Flatcar Stable release you want to use for the initial installation, e.g., 2605.12.0"
}
```

An `outputs.tf` file shows the resulting IP addresses:

```
output "ip-addresses" {
  value = {
    for key in var.machines :
    "${var.cluster_name}-${key}" => azurerm_linux_virtual_machine.machine[key].public_ip_address
  }
}
```

Now you can use the module by declaring the variables and a Container Linux Configuration for a machine.
First create a `terraform.tfvars` file with your settings:

```
cluster_name            = "mycluster"
machines                = ["mynode"]
ssh_keys                = ["ssh-rsa AA... me@mail.net"]
flatcar_stable_version  = "x.y.z"
resource_group_location = "westeurope"
```

You can resolve the latest Flatcar Stable version with this shell command:

```
curl -sSfL https://stable.release.flatcar-linux.net/amd64-usr/current/version.txt | grep -m 1 FLATCAR_VERSION_ID= | cut -d = -f 2
```

The machine name listed in the `machines` variable is used to retrieve the corresponding [Container Linux Config](../../provisioning/config-transpiler/configuration) template from the `cl/` subfolder.
For each machine in the list, you should have a `machine-NAME.yaml.tmpl` file with a corresponding name.

Create the configuration for `mynode` in the file `cl/machine-mynode.yaml.tmpl`:

```yaml
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

First find your subscription ID, then create a service account for Terraform and note the tenant ID, client (app) ID, client (password) secret:

```
az login
az account set --subscription <azure_subscription_id>
az ad sp create-for-rbac --name <service_principal_name> --role Contributor
{
  "appId": "...",
  "displayName": "<service_principal_name>",
  "password": "...",
  "tenant": "..."
}
```

Make sure you have AZ CLI version 2.32.0 if you get the error `Values of identifierUris property must use a verified domain of the organization or its subdomain`.
AZ CLI installation docs are [here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-linux?pivots=apt#option-2-step-by-step-installation-instructions).

Before you run Terraform, accept the image terms:

```
az vm image terms accept --urn kinvolk:flatcar-container-linux:stable:<flatcar_stable_version>
```

Finally, run Terraform v0.13 as follows to create the machine:

```
export ARM_SUBSCRIPTION_ID="<azure_subscription_id>"
export ARM_TENANT_ID="<azure_subscription_tenant_id>"
export ARM_CLIENT_ID="<service_principal_appid>"
export ARM_CLIENT_SECRET="<service_principal_password>"
terraform init
terraform plan
terraform apply
```

Log in via `ssh core@IPADDRESS` with the printed IP address.

When you make a change to `cl/machine-mynode.yaml.tmpl` and run `terraform apply` again, the machine will be replaced.

You can find this Terraform module in the repository for [Flatcar Terraform examples](https://github.com/flatcar/flatcar-terraform/tree/main/azure).

### Known issues

With Terraform version 3.x it [is currently not possible to partition and format data disks](https://github.com/hashicorp/terraform-provider-azurerm/issues/6117)
for a `azurerm_linux_virtual_machine` with ignition's storage configuration. It might be possible to use the deprecated `azurerm_virtual_machine` module.
Another workaround is to use a systemd unit to run a script that does partitioning and formatting for you. Here is an example on how to create a
single partition with an ext4 filesystem:
```
systemd:
  units:
    - name: partition-drive.service
      enabled: true
      contents: |
        [Unit]
        Description="Partition drive"
        Before=docker.service
        ConditionFirstBoot=yes
        [Service]
        Type=oneshot
        RemainAfterExit=yes
        ExecStart=/opt/bin/partition-drive.sh
        [Install]
        WantedBy=first-boot-complete.target
storage:
  files:
    - path: /opt/bin/partition-drive.sh
      mode: 0700
      contents:
        inline: |
          #!/bin/bash
          set -o errexit
          set -o pipefail
          set -o nounset

          disk_device="/dev/disk/azure/scsi1/lun10"
          partition="/dev/disk/azure/scsi1/lun10-part1"

          until [[ -e $disk_device ]]; do echo "Waiting for device" && sleep 1; done

          if [[ -n $(lsblk -no NAME $disk_device | sed -n '2,$p') ]]; then
              echo "Disk $disk_device is partitioned."
          else
              echo 'type=83' | sfdisk /dev/disk/azure/scsi1/lun10
          fi

          sleep 3

          if [[ -n $(lsblk -no FSTYPE $partition) ]]; then
              echo "Partition $partition already formatted."
          else
              mkfs.ext4 -F /dev/disk/azure/scsi1/lun10-part1
          fi
```

[flatcar-user]: https://groups.google.com/forum/#!forum/flatcar-linux-user
[etcd-docs]: https://etcd.io/docs
[quickstart]: ../
[reboot-docs]: ../../setup/releases/update-strategies
[azure-cli]: https://docs.microsoft.com/en-us/cli/azure/overview
[butane-configs]: ../../provisioning/config-transpiler
[irc]: irc://irc.freenode.org:6667/#flatcar
[docs]: ../../
[resource-group]: https://docs.microsoft.com/en-us/azure/architecture/best-practices/naming-conventions#naming-rules-and-restrictions
[storage-account]: https://docs.microsoft.com/en-us/azure/storage/common/storage-account-overview#naming-storage-accounts
[azure-flatcar-image-upload]: https://github.com/flatcar/flatcar-cloud-image-uploader
[release-notes]: https://flatcar.org/releases
[update-docs]: ../../setup/releases/update-strategies
