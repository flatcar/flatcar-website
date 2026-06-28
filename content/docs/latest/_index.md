---
content_type: flatcar
title: Flatcar Container Linux
main_menu: true
weight: 40
---

### What is Flatcar?

Flatcar Container Linux is an immutable operating system (OS) that can securely host many different types of containers, ranging from Docker to Kubernetes and more. It uses an automated provisioning process that provides consistent installations for every machine. This process reduces human error and creates more stable containerization hosting than Windows, Mac, and general-purpose Linux distributions.

### How does it work?

Gentoo Linux is the core OS for Flatcar because it's extremely flexible and modular. Gentoo makes it possible to create a minimal, immutable OS that is just a container host and nothing else. As a result, the Flatcar OS is very lightweight, secure, and scales easily because it only provides components for containerization. It also has automatic updates that make it more convenient to use and ensures that instances are always up to date. 

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
[qemu]: ./fb-provision/vms/qemu
[libvirt]: ./fb-provision/vms/libvirt
[virtualbox]: ./fb-provision/vms/virtualbox
[vagrant]: ./fb-provision/vms
[hyper-v]: ./fb-provision/vms/hyper-v
[kubevirt]: ./fb-provision/vms/kubevirt
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
