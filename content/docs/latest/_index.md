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

### Installing Flatcar

Flatcar Container Linux runs on most cloud providers, virtualization
platforms and bare metal servers. 

#### Cloud Providers
 * [Amazon EC2][ec2]
 * [Microsoft Azure][azure]
 * [Google Compute Engine][gce]
 * [Equinix Metal][equinix-metal]
 * [VMware][vmware]
 * [DigitalOcean][digital-ocean]
 * [Hetzner][hetzner]
 * [OpenStack][openstack]
 * [Brightbox][brightbox]
 * [Scaleway][scaleway] (community support)
 * [OVHcloud][ovhcloud] (community support)
 * [Akamai][akamai] (community support)

#### Virtualization options
It's easy to run a local Flatcar VM on your laptop for testing and debugging
purposes. You can use any of the following options.

 * [QEMU][qemu]
 * [libVirt][libvirt]
 * [VirtualBox][virtualbox] (community support)
 * [Vagrant][vagrant] (community support)
 * [Hyper-V][hyper-v] (community support)
 * [KubeVirt][kubevirt] (community support)

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

### Tutorial
Flatcar tutorial to deep dive into some Flatcar fundamental concepts.
* [Introduction][tutorial-introduction]
* [Hands-on 1: Discovering][tutorial-hands-on-1]
* [Hands-on 2: Provisioning][tutorial-hands-on-2]
* [Hands-on 3: Deploying][tutorial-hands-on-3]
* [Hands-on 4: Updating][tutorial-hands-on-4]

[quick-start]: installing
[supply-chain-security]: reference/supply-chain
[ignition-what]: provisioning/ignition/
[ignition-boot]: provisioning/ignition/boot-process
[ignition-network]: provisioning/ignition/network-configuration
[ignition-metadata]: provisioning/ignition/dynamic-data
[container-linux-config]: provisioning/cl-config/
[config-transpiler]: provisioning/config-transpiler/
[config-intro]: provisioning/config-transpiler/getting-started
[config-dynamic-data]: provisioning/config-transpiler/dynamic-data
[config-examples]: provisioning/config-transpiler/examples
[matchbox]: https://matchbox.psdn.io/
[ipxe]: installing/bare-metal/booting-with-ipxe
[pxe]: installing/bare-metal/booting-with-pxe
[install-to-disk]: installing/bare-metal/installing-to-disk
[boot-iso]: installing/bare-metal/booting-with-iso
[filesystem-placement]: setup/storage/raid
[migrate-from-container-linux]: migrating-from-coreos/
[update-from-container-linux]: migrating-from-coreos/update-from-container-linux
[ec2]: installing/cloud/aws-ec2
[digital-ocean]: installing/cloud/digitalocean
[gce]: installing/cloud/gcp
[azure]: installing/cloud/azure
[qemu]: installing/vms/qemu
[equinix-metal]: installing/cloud/equinix-metal
[libvirt]: installing/vms/libvirt
[virtualbox]: installing/vms/virtualbox
[vagrant]: installing/vms/vagrant
[hyper-v]: installing/vms/hyper-v
[kubevirt]: installing/vms/kubevirt
[vmware]: installing/cloud/vmware
[cluster-architectures]: setup/clusters/architectures
[update-strategies]: setup/releases/update-strategies
[clustering-machines]: setup/clusters/discovery
[verify-container-linux]: setup/releases/verify-images
[networkd-customize]: setup/customization/network-config-with-networkd
[systemd-drop-in]: setup/systemd/drop-in-units
[environment-variables-systemd]: setup/systemd/environment-variables
[dns]: setup/customization/configuring-dns
[date-timezone]: setup/customization/configuring-date-and-timezone
[users]: setup/customization/adding-users
[parameters]: setup/customization/other-settings
[disk-space]: setup/storage/adding-disk-space
[mounting-storage]: setup/storage/mounting-storage
[power-management]: setup/customization/power-management
[registry-authentication]: container-runtimes/registry-authentication
[iscsi]: setup/storage/iscsi
[swap]: setup/storage/adding-swap
[zfsextension]: setup/storage/zfs
[ec2-container-service]: setup/clusters/booting-on-ecs/
[manage-docker-containers]: setup/systemd/getting-started
[udev-rules]: setup/systemd/udev-rules
[update-conf]: setup/releases/update-conf
[release-channels]: setup/releases/switching-channels
[tasks-with-systemd]: setup/systemd/timers
[luks-encryption]: setup/security/luks
[ssh-daemon]: setup/security/customizing-sshd
[sssd-container-linux]: setup/security/sssd
[hardening-container-linux]: setup/security/hardening-guide
[hardware-requirements]: setup/security/trusted-computing-hardware-requirements
[cert-authorities]: setup/security/adding-certificate-authorities
[selinux]: setup/security/selinux
[disabling-smt]: setup/security/disabling-smt
[enabling-fips]: setup/security/fips
[audit-system]: setup/security/audit
[debugging-tools]: setup/debug/install-debugging-tools
[btrfs]: setup/debug/btrfs-troubleshooting
[system-log]: setup/debug/reading-the-system-log
[crash-log]: setup/debug/collecting-crash-logs
[container-linux-rollbacks]: setup/debug/manual-rollbacks
[docker]: container-runtimes/getting-started-with-docker
[customizing-docker]: container-runtimes/customizing-docker
[use-a-custom-docker-or-containerd-version]: container-runtimes/use-a-custom-docker-or-containerd-version
[developer-guides]: reference/developer-guides/
[integrations]: reference/integrations/
[migrating-from-cloud-config]: provisioning/cl-config/from-cloud-config
[containerd-for-kubernetes]: container-runtimes/switching-from-docker-to-containerd-for-kubernetes
[terraform]: provisioning/terraform/
[hetzner]: installing/cloud/hetzner
[sysext]: provisioning/sysext/
[acpi]: setup/customization/ACPI
[openstack]: installing/cloud/openstack
[brightbox]: installing/cloud/brightbox
[kubernetes]: container-runtimes/getting-started-with-kubernetes
[ha-kubernetes]: container-runtimes/high-availability-kubernetes
[using-nvidia]: setup/customization/using-nvidia
[tutorial-introduction]: tutorial/
[tutorial-hands-on-1]: tutorial/hands-on-1
[tutorial-hands-on-2]: tutorial/hands-on-2
[tutorial-hands-on-3]: tutorial/hands-on-3
[tutorial-hands-on-4]: tutorial/hands-on-4
[scaleway]: installing/community-platforms/scaleway
[ovhcloud]: installing/community-platforms/ovhcloud
[akamai]: installing/community-platforms/akamai
[nebraska]: nebraska
