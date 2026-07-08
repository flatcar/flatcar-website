---
title: Deployments
weight: 50
description: >
  Deploy Flatcar Container Linux to cloud providers, virtualization platforms, and bare metal.
---

Flatcar can be deployed in three ways, depending on how much of the underlying infrastructure you manage yourself:

- **[Cloud Providers](./cloud/)**: the provider manages the VM lifecycle for you. You point at an image and pass Ignition via `user-data`; hardware, network, and storage are handled by the platform.
- **[Virtualization Options](./virt-options/)**: run Flatcar as a VM on a hypervisor you manage. You handle boot, storage, network, and Ignition delivery to the guest.
- **[Bare Metal](./bare-metal/)**: install Flatcar directly onto physical hardware, via ISO images, PXE / iPXE, or an installer running on an existing Linux system.

Within each category, some platforms are officially covered by the automated test suite and others are maintained by community contributors on a best-effort basis. Community-supported platforms are marked *(community support)* in the sidebar and on their individual pages.
