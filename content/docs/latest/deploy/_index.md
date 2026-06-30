---
title: Deployments
weight: 50
description: >
  Deploy Flatcar Container Linux to cloud providers, virtualization platforms, and bare metal.
---

# Flatcar Deployments

Covers cloud providers, virtualization platforms, and bare metal.

## Cloud Providers

| Provider | Support |
|---|---|
| Amazon EC2 | Official |
| Microsoft Azure | Official |
| Google Compute Engine | Official |
| VMware | Official |
| Hetzner | Official |
| DigitalOcean | Official |
| Akamai/Linode | Official |
| STACKIT | Official |
| Brightbox | Official |
| Exoscale | Community |
| Scaleway | Community |
| OracleCloud | Community |
| OVHcloud | Community |
| Vultr | Community |

Ignition/Butane config is passed via the provider's **user data** / **custom data** field at instance creation.

## Virtualization Options


| Platform | Support |
|---|---|
| QEMU/KVM | Official |
| libvirt | Official |
| KubeVirt | Community |
| Hyper-V | Community |
| VirtualBox | Community |
| Vagrant | Community |
| Proxmox VE | Community |
| OpenStack | Community |
| Eucalyptus | Community |

## Bare Metal

| Method | Notes |
|---|---|
| ISO | Boot and install interactively |
| PXE | Network boot; must add `flatcar.first_boot=1` to kernel args |
| iPXE | Network boot via HTTP |
| `flatcar-install` | Run on existing Linux system to install to disk |
| Raspberry Pi | ARM64 support |

## Notes for Distributors

Covers Flatcar-specific considerations for platform vendors building images or integrations, including OEM partition usage and update server requirements.