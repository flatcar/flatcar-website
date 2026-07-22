---
title: Getting Started with Flatcar Container Linux
linktitle: Getting Started
weight: 10
aliases:
  - /docs/latest/installing/
---

This section helps you get up and running with Flatcar. It introduces essential concepts and points you to hands-on learning resources:

- [Flatcar Quickstart](./quickstart/) - Provision Flatcar locally in a QEMU virtual machine.
- [Learning Series](./learning-series/) - In-depth guides for core Flatcar topics.

## Configuration and Provisioning

Flatcar is configured at provisioning time, before the first boot, typically using the following provisioning tools:

- [Butane](../fb-provision/butane/) is human-readable YAML that must be converted (transpiled) into Ignition config before Flatcar can use it. Download from [CoreOS Butane Releases](https://github.com/coreos/butane/releases). For a comprehensive discussion of available options, see the [Butane configuration specification](../fb-provision/butane/configuration).
- [Ignition](../fb-provision/ignition/boot-process) is machine-readable JSON consumed by Flatcar's first-boot provisioning service. Cloud providers supply the Ignition config as user data or custom data suitable for private cloud and bare-metal installs. Ignition config is rarely written by hand and best practices are to generate it using automation or transpiled from Butane.

See the [Flatcar Quickstart](./quickstart) for a detailed procedure on using these tools.

### Automatic updates

Flatcar has automatic updates enabled by default. Instances download and stage new OS versions in the background and can reboot into the updated OS when an update becomes available. To change this default behavior, including defining reboot windows or disabling reboots, see [update strategies](../updates-releases/releases/update-strategies).
To disable downloading updates altogether, either disable the `update-engine` service via a user-supplied `systemd` config or use an invalid URL in the `SERVER` field of [update.conf](../updates-releases/releases/update-conf).

## To Learn More

The Flatcar documentation covers several technical areas. Use the following table to assist in your learning path in addition to this Getting Started section.

<style>.learn-more-table td { vertical-align: top; }</style>
<div class="learn-more-table">

| Provisioning & Deployment | Orchestration & Capabilities | Maintenance & Development |
| --- | --- | --- |
| [First Boot & Provisioning](./fb-provision/)<br>[OS Configuration](./os-config/)<br>[System Extensions](./sys-ext/)<br>[Deployments](./deploy/) | [Orchestration & Container Runtimes](./orchestrate/)<br>[Nebraska Update Manager & Releases](./updates-releases/)<br>[Security](./security/) | [Diagnostics and Fixing Issues](./diagnostics/)<br>[CoreOS Migration](./coreos-migration/)<br>[Developer Guides](./devguide/) |

</div>
