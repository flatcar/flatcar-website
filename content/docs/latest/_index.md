---
content_type: flatcar
title: Flatcar Container Linux
main_menu: true
weight: 40
---

# Flatcar Container Linux

Flatcar Container Linux is a minimal, immutable, container-optimized Linux OS and the active successor to CoreOS Container Linux. Gentoo Linux is the underlying technology of Flatcar. It was chosen because it's an extremely flexible and modular OS. With modifications from ChromeOS and CoreOS, the Flatcar team used Gentoo to create a minimal, immutable OS that is just a container host and nothing else. 

Flatcar is a Cloud Native Computing Foundation (CNCF) project. The name comes from the flat railcar used to transport shipping containers. Flatcar runs on most cloud providers, virtualization platforms and bare metal servers.

To learn about Flatcar, see the Quickstart and Learning Series described in [Getting Started](./getting-started/_index.md).

## Five Core Tenets

| Tenet | Description |
|---|---|
| **Immutable and image-based** | The OS cannot be modified. The OS partition is read-only and dm-verity protected. OS binaries cannot be changed. Updates replace all OS binaries atomically including kernel and initrd. No version drift as installing applications to the Flatcar base OS is prevented; you get what's shipped in the OS image. No package manager. |
| **Minimal and container-optimized** | The OS ships the minimal set of tools necessary to run container workloads: docker and containerd. Includes basic tools and utilities for setting up nodes. Applications run as containers or `systemd-sysext` images. |
| **Fully automated** | Declarative Ignition/Butane config applied once at first boot. No configuration drift. |
| **Thoroughly tested and self-updating** | Over one hundred automated scenario tests to ensure distribution upgrades are seamless and frictionless, user workloads will continue to run. Supports atomic in-place updates of the OS with rollbacks, with flexibly customizable scheduling. |
| **Community stewarded, not vendor driven** | Flatcar maintainers and contributors come from a variety of backgrounds and work for different employers, or participate privately in the project. Flatcar is not a vendor driven product nor aims to ever be one. |

## Flatcar documentation sections

The following table describes how Flatcar documentation is organized.

| Section | Description |
| --- | --- |
| [CoreOS Migration](./coreos-migration/update-from-container-linux.md) | How to migrate to Flatcar from CoreOS. |
| [Flatcar Deployments](./deploy/_index.md) |Describes bare meta deployment, cloud providers, and virtualization options.|
| [Developer Guides](./devguide/_index.md) |Provides SDKs and guides for building Flatcar Container Linux from source,  modifying the OS, and guides for customization, integrations, and supply chains.|
| [First Boot & Provisioning](./fb-provision/_index.md) |Describes first book configuration and provisioning tools.|
| [Getting Started](./getting-started/_index.md) |Contains a quickstart and an in-depth learning series tutorial.|
| [Orchestration & Container Runtimes](./orchestrate/_index.md) | Describes using Flatcar for Kubernetes and container runtime options.|
| [OS Configuration](./os-config/_index.md) |Describes configuration settings for Host, Network, Storage, and `systemd`. |
| [Security](./security/_index.md) | Covers security hardening, encryption, and authentication.|
| [System Extensions](./sys-ext/_index.md) |Descibes the `systemd-sysext` feature finally provides a way to extend the base OS.|
| [Nebraska Update Manager & Releases](./updates-releases/_index.md) |Describes the Nebraska Update Manager and also managing release channels.|
| [How to contribute](./coreos-migration/_index.md) | Shows where to get help, collaborate, and contribute to the Flatcar community. |

## Community

- Slack: `#flatcar` in Kubernetes Slack
- Discord: https://discord.gg/PMYjFUsJyq
- GitHub: https://github.com/flatcar

