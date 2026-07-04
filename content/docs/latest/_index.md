---
content_type: flatcar
title: Flatcar Container Linux
main_menu: true
weight: 40
---

Flatcar Container Linux is a container optimized OS that ships a minimal OS
image, which includes only the tools needed to run containers. The OS is
shipped through an immutable filesystem and includes automatic atomic
updates.


### Getting Started

If you're new to Flatcar and if you're looking for a brief introduction on getting Flatcar up and running, please have a look at our [quickstart guide][quick-start].

Find more elaborate guides covering specific aspects of Flatcar use in our [Flatcar self-paced learning series][learning-series].

### Core Tenets

1. ***Immutable and image-based***.
   - In contrast to general purpose Linux distributions, the OS cannot be modified. The OS partition is read-only and dm-verity protected. OS binaries cannot be changed. Updates *always* update *all* binaries of the base OS, including kernel and initrd.
   - There is no way to install applications to the Flatcar base OS; you get what's shipped in the OS image, that's it.
   - There is no package manager or package management; tools shipped with the OS image cannot be added / removed or individually updated. This prevents version drift: any given Flatcar release version corresponds to the complete version set of all tools and binaries shipped with the respective OS release.
2. ***Minimal and optimised for container workloads***.
   - The OS ships the minimal set of tools necessary to run container workloads: docker and containerd.
   - Basic tools and utilities for setting up nodes (partitioning, crypto, volume management, networking tools etc.) are also included.
   - User-level services and applications must be run as container images, or, when OS level access is required, as [system extensions][sysext].
3. ***Fully automated***.
   - Provisioning and operations are fully automated.
   - Nodes are configured via [declarative configuration][config-examples] that is passed to node provisioning. The configuration is applied **once**, at first boot, preventing configuration drift.
4. ***Thoroughly tested and self-updating***.
   - We never break user workloads, ever. We guarantee even major distribution upgrades are seamless and frictionless, user workloads will continue to run.
   - Flatcar releases, nightlies, and even pull requests to the OS repository are thoroughly and rigorously tested. Our automated test suite covers well over 100 scenario tests.
   - Flatcar supports atomic in-place updates of the OS, with flexibly customisable scheduling / signaling of node refreshes (reboots).
   - Flatcar also supports atomic, fully automatable roll-backs in case of issues.
   - Flatcar users have the opportunity to field-test incoming releases via Beta canaries, and report issues with their workloads.
     No Beta with known issues will ever transition to Stable.
5. ***Community stewarded, not vendor driven***.
   - Flatcar is a CloudNative Computing Foundation project.
   - Flatcar maintainers and contributors come from a variety of backgrounds and work for different employers, or participate privately in the project.
     Flatcar is not a vendor driven product nor aims to ever be one.

### Installing Flatcar

Flatcar Container Linux runs on most cloud providers, virtualization
platforms and bare metal servers. 

#### Cloud Providers
 * [Amazon EC2][ec2]
 * [Microsoft Azure][azure]
 * [Google Compute Engine][gce]
 * [VMware][vmware]
 * [DigitalOcean][digital-ocean]
 * [Hetzner][hetzner]
 * [OpenStack][openstack]
 * [Brightbox][brightbox]
 * [Scaleway][scaleway] (community support)
 * [OracleCloud][oraclecloud] (community support)
 * [OVHcloud][ovhcloud] (community support)
 * [Akamai/Linode][akamai]
 * [STACKIT][stackit]

#### Virtualization options
It's easy to run a local Flatcar VM on your laptop for testing and debugging
purposes. You can use any of the following options.

 * [QEMU][qemu]
 * [libVirt][libvirt]
 * [VirtualBox][virtualbox] (community support)
 * [Vagrant][vagrant] (community support)
 * [Hyper-V][hyper-v] (community support)
 * [KubeVirt][kubevirt] (community support)
 * [Proxmox VE][proxmoxve] (community support)

#### Bare Metal
You can install Flatcar on bare metal machines in different ways: using ISO
images, booting from PXE or iPXE, and even by running an installation
script on an existing Linux system.

 * [Installing from ISO images][boot-iso]
 * [Booting with PXE][pxe]
 * [Booting with iPXE][ipxe]
 * [Installing with flatcar-install][install-to-disk]

If you want to provide metadata to your baremetal machines, we recommend
using [Matchbox][matchbox].

#### Upgrading from CoreOS Container Linux

Flatcar Container Linux is a drop-in replacement of CoreOS Container Linux.
If you are a CoreOS Container Linux user looking for a replacement,
checkout our guides to [migrate from CoreOS Container
Linux][migrate-from-container-linux], or you can [update from CoreOS
Container Linux][update-from-container-linux] directly.

### Provisioning Tools

[Ignition][ignition-what] is the recommended way to provision Flatcar
Container Linux at first boot.  Ignition uses a JSON configuration file,
and it is recommended to generate it from the [Container Linux
Config][container-linux-config] YAML format, which has additional features.
The [Container Linux Config Transpiler][config-transpiler] converts a
Container Linux Config to an Ignition config.

 * [Understanding the Boot Process][ignition-boot]
 * [Configuring the Network with Ignition][ignition-network]
 * [Using metadata during provisioning][ignition-metadata]
 * [Getting started with Butane][config-intro]
 * [Examples of using Butane][config-examples]
 * [Using Terraform to provision Flatcar Container Linux][terraform]
 * [Extending the base OS with systemd-sysext images][sysext]

### Setting Flatcar Up and Common Operations

Follow these guides to connect your machines together as a cluster,
configure machine parameters, create users, inject multiple SSH keys, and
more.

#### Customizing Flatcar
 * [Using networkd to customize networking][networkd-customize]
 * [Using systemd drop-in units][systemd-drop-in]
 * [Using environment variables in systemd units][environment-variables-systemd]
 * [Using systemd and udev rules][udev-rules]
 * [Using NVIDIA GPUs on Flatcar][using-nvidia]
 * [Scheduling tasks with systemd timers][tasks-with-systemd]
 * [Configuring DNS][dns]
 * [Configuring date & timezone][date-timezone]
 * [Adding users][users]
 * [Kernel modules / sysctl parameters][parameters]
 * [Adding swap][swap]
 * [Power management][power-management]
 * [ACPI][acpi]

#### Managing Releases and Updates
 * [Switching release channels][release-channels]
 * [Configuring the update strategy][update-strategies]
 * [Flatcar update configuration specification][update-conf]
 * [Verifying Flatcar Images with GPG][verify-container-linux]
 * [Nebraska][nebraska]

#### Creating Clusters
 * [Cluster architectures][cluster-architectures]
 * [Clustering machines][clustering-machines]
 * [Using Amazon EC2 Container Service][ec2-container-service]

#### Managing Storage
 * [Using RAID for the root filesystem][filesystem-placement]
 * [Adding disk space][disk-space]
 * [Mounting storage][mounting-storage]
 * [iSCSI configuration][iscsi]
 * [ZFS Extension][zfsextension]

#### Additional security options
 * [Setting up LUKS disk encryption][luks-encryption]
 * [Customizing the SSH daemon][ssh-daemon]
 * [Configuring SSSD on Flatcar Container Linux][sssd-container-linux]
 * [Hardening a Flatcar Container Linux machine][hardening-container-linux]
 * [Trusted Computing Hardware Requirements][hardware-requirements]
 * [Adding Cert Authorities][cert-authorities]
 * [Using SELinux][selinux]
 * [Disabling SMT][disabling-smt]
 * [Enabling FIPS][enabling-fips]
 * [Using the audit subsystem][audit-system]

#### Debugging Flatcar
 * [Install debugging tools][debugging-tools]
 * [Working with btrfs][btrfs]
 * [Reading the system log][system-log]
 * [Collecting crash logs][crash-log]
 * [Manual Flatcar Container Linux rollbacks][container-linux-rollbacks]

### Container Runtimes
Flatcar Container Linux supports all of the popular methods for running
containers, and you can choose to interact with the containers at a
low-level, or use a higher level orchestration framework. Listed below are
some guides to help you choose and make use of the different runtimes.

 * [Getting started with Docker][docker]
 * [Customizing Docker][customizing-docker]
 * [Using systemd to manage Docker containers][manage-docker-containers]
 * [Use a custom Docker or containerd version][use-a-custom-docker-or-containerd-version]
 * [Authenticating to Container registries][registry-authentication]
 * [Getting started with Kubernetes][kubernetes]
 * [High availability Kubernetes][ha-kubernetes]

### Developer guides and Reference
APIs and troubleshooting guides for working with Flatcar Container Linux.

* [Developer guides][developer-guides]: Comprehensive guides on developing for Flatcar, working with the SDK, and on building and extending OS images.
* [Integrations][integrations]
* [Migrating from cloud-config to Container Linux Config][migrating-from-cloud-config]
* [Flatcar Supply Chain Security (SLSA and SPDX SBOM)][supply-chain-security] detailing security mechanisms employed at build / release time as well as at run-time to ensure validity of inputs processed and outputs shipped.

[quick-start]: ./getting-started
[learning-series]: ./getting-started/learning-series
[supply-chain-security]: ./security/supply-chain
[ignition-what]: ./fb-provision/ignition/
[ignition-boot]: ./fb-provision/ignition/boot-process
[ignition-network]: ./fb-provision/ignition/network-configuration
[ignition-metadata]: ./fb-provision/ignition/dynamic-data
[container-linux-config]: ./fb-provision/cl-config/
[config-transpiler]: ./fb-provision/butane/
[config-intro]: ./fb-provision/butane/getting-started
[config-dynamic-data]: ./fb-provision/butane/dynamic-data
[config-examples]: ./fb-provision/butane/examples
[matchbox]: https://matchbox.psdn.io/
[ipxe]: ./deploy/bare-metal/booting-with-ipxe
[pxe]: ./deploy/bare-metal/booting-with-pxe
[install-to-disk]: ./deploy/bare-metal/installing-to-disk
[boot-iso]: ./deploy/bare-metal/booting-with-iso
[filesystem-placement]: ./os-config/storage/raid
[migrate-from-container-linux]: ./coreos-migration/
[update-from-container-linux]: ./coreos-migration/update-from-container-linux
[ec2]: ./deploy/cloud/aws-ec2
[digital-ocean]: ./deploy/cloud/digitalocean
[gce]: ./deploy/cloud/gcp
[azure]: ./deploy/cloud/azure
[qemu]: ./deploy/virt-options/qemu
[libvirt]: ./deploy/virt-options/libvirt
[virtualbox]: ./deploy/virt-options/virtualbox
[vagrant]: ./deploy/virt-options/vagrant
[hyper-v]: ./deploy/virt-options/hyper-v
[kubevirt]: ./deploy/virt-options/kubevirt
[proxmoxve]: ./deploy/virt-options/proxmoxve
[vmware]: ./deploy/cloud/vmware
[cluster-architectures]: ./orchestrate/clusters/architectures
[update-strategies]: ./updates-releases/releases/update-strategies
[clustering-machines]: ./orchestrate/clusters/discovery
[verify-container-linux]: ./updates-releases/releases/verify-images
[networkd-customize]: ./os-config/network/network-config-with-networkd
[systemd-drop-in]: ./os-config/host-config/drop-in-units
[environment-variables-systemd]: ./os-config/host-config/environment-variables
[dns]: ./os-config/network/configuring-dns
[date-timezone]: ./os-config/host-config/configuring-date-and-timezone
[users]: ./os-config/host-config/adding-users
[parameters]: ./os-config/host-config/other-settings
[disk-space]: ./os-config/storage/adding-disk-space
[mounting-storage]: ./os-config/storage/mounting-storage
[power-management]: ./os-config/host-config/power-management
[registry-authentication]: ./orchestrate/containers/registry-authentication
[iscsi]: ./os-config/storage/iscsi
[swap]: ./os-config/storage/adding-swap
[zfsextension]: ./os-config/storage/zfs
[ec2-container-service]: ./orchestrate/clusters/booting-on-ecs/
[manage-docker-containers]: ./os-config/systemd/getting-started
[udev-rules]: ./os-config/systemd/udev-rules
[update-conf]: ./updates-releases/releases/update-conf
[release-channels]: ./updates-releases/releases/switching-channels
[tasks-with-systemd]: ./os-config/host-config/timers
[luks-encryption]: ./security/encryption/luks
[ssh-daemon]: ./security/cert-auth/customizing-sshd
[sssd-container-linux]: ./security/cert-auth/sssd
[hardening-container-linux]: ./security/hardening/hardening-guide
[hardware-requirements]: ./security/hardening/trusted-computing-hardware-requirements
[cert-authorities]: ./security/cert-auth/adding-certificate-authorities
[selinux]: ./security/encryption/selinux
[disabling-smt]: ./security/hardening/disabling-smt
[enabling-fips]: ./security/hardening/fips
[audit-system]: ./security/hardening/audit
[debugging-tools]: ./diagnostics/install-debugging-tools
[btrfs]: ./diagnostics/btrfs-troubleshooting
[system-log]: ./diagnostics/reading-the-system-log
[crash-log]: ./diagnostics/collecting-crash-logs
[container-linux-rollbacks]: ./diagnostics/manual-rollbacks
[docker]: ./orchestrate/containers/getting-started-with-docker
[customizing-docker]: ./orchestrate/containers/customizing-docker
[use-a-custom-docker-or-containerd-version]: ./orchestrate/containers/use-a-custom-docker-or-containerd-version
[developer-guides]: ./devguide/
[integrations]: ./devguide/integrations/
[migrating-from-cloud-config]: ./fb-provision/cl-config/from-cloud-config
[containerd-for-kubernetes]: ./orchestrate/containers/switching-from-docker-to-containerd-for-kubernetes
[terraform]: ./fb-provision/infrastructure/
[hetzner]: ./deploy/cloud/hetzner
[sysext]: ./sys-ext/
[acpi]: ./os-config/network/ACPI
[openstack]: ./deploy/cloud/openstack
[brightbox]: ./deploy/cloud/brightbox
[kubernetes]: ./orchestrate/kubernetes/getting-started-with-kubernetes
[ha-kubernetes]: ./orchestrate/kubernetes/high-availability-kubernetes
[using-nvidia]: ./os-config/host-config/using-nvidia
[scaleway]: ./deploy/virt-options/scaleway
[oraclecloud]: ./deploy/virt-options/oraclecloud
[ovhcloud]: ./deploy/virt-options/ovhcloud
[akamai]: ./deploy/cloud/akamai
[nebraska]: ./updates-releases/nebraska
[stackit]: ./deploy/cloud/stackit
