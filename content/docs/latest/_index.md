---
content_type: flatcar
title: Flatcar Container Linux
main_menu: true
weight: 40
---

# Flatcar Container Linux

Flatcar Container Linux is a minimal, immutable, container-optimized Linux OS and the active successor to CoreOS Container Linux. Gentoo Linux is the underlying technology of Flatcar. It was chosen because it's an extremely flexible and modular OS. With modifications from ChromeOS and CoreOS, the Flatcar team used Gentoo to create a minimal, immutable OS that is just a container host and nothing else. 

Flatcar is a Cloud Native Computing Foundation (CNCF) project. The name comes from the flat railcar used to transport shipping containers. Flatcar runs on most cloud providers, virtualization platforms and bare metal servers. 

## Five Core Tenets

| Tenet | Description |
|---|---|
| **Immutable and image-based** | The OS cannot be modified. The OS partition is read-only and dm-verity protected. OS binaries cannot be changed. Updates replace all OS binaries atomically including kernel and initrd. No version drift as installing applications to the Flatcar base OS is prevented; you get what's shipped in the OS image. No package manager. |
| **Minimal and container-optimized** | The OS ships the minimal set of tools necessary to run container workloads: docker and containerd. Includes basic tools and utilities for setting up nodes. Applications run as containers or `systemd-sysext` images. |
| **Fully automated** | Declarative Ignition/Butane config applied once at first boot. No configuration drift. |
| **Thoroughly tested and self-updating** | Over one hundred automated scenario tests to ensure distribution upgrades are seamless and frictionless, user workloads will continue to run. Supports atomic in-place updates of the OS with rollbacks, with flexibly customizable scheduling. |
| **Community stewarded, not vendor driven** | Flatcar maintainers and contributors come from a variety of backgrounds and work for different employers, or participate privately in the project. Flatcar is not a vendor driven product nor aims to ever be one. |

## Update mechanism

Flatcar uses the **USR-A / USR-B** dual-partition scheme (same as ChromeOS). One partition is active, the other is standby. Updates apply to the standby partition; a reboot switches to it. Boot failure automatically falls back to the previous partition.

### Update channels

| Channel | Cadence | Support |
|---|---|---|
| Alpha | Frequent | Community |
| Beta | ~2 months | Community |
| Stable | ~2 months | Community / Pro |
| LTS | 12 months | 18 months (commercial) |

## Getting Started

If you're new to Flatcar and if you're looking for a brief introduction on getting Flatcar up and running, see the quickstart guide.

Find more elaborate guides covering specific aspects of Flatcar use in our Flatcar self-paced learning series.

**Provisioning flow**

```
Butane YAML  →  butane transpile  →  Ignition JSON  →  passed as userdata  →  applied at first boot
```
## Flatcar vs CoreOS Container Linux

Drop-in replacement. Key naming changes:

| CoreOS | Flatcar |
|---|---|
| `coreos.first_boot=1` | `flatcar.first_boot=1` |
| `coreos.config.url` | `ignition.config.url` |
| `coreos.oem.id` | `flatcar.oem.id` |
| `coreos-installer` | `flatcar-installer` |

Both naming conventions are supported in current releases during migration.

## Provisioning tools

Ignition is the recommended way to provision Flatcar
Container Linux at first boot.  Ignition uses a JSON configuration file,
and it is recommended to generate it from the Container Linux
Config YAML format, which has additional features.
The Container Linux Config Transpiler converts a
Container Linux Config to an Ignition config.

## Container runtimes
Flatcar Container Linux supports all of the popular methods for running
containers, and you can choose to interact with the containers at a
low-level, or use a higher level orchestration framework. Listed below are
some guides to help you choose and make use of the different runtimes.

## Community

- Slack: `#flatcar` in Kubernetes Slack
- Discord: https://discord.gg/PMYjFUsJyq
- GitHub: https://github.com/flatcar

