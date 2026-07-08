---
title: Virtualization Options
weight: 40
aliases:
    - /docs/latest/installing/community-platforms/
    - ../os/community-platforms
    - ../community-platforms
    - /docs/latest/installing/vms/
---

Virtualization options let you run Flatcar as a VM on a hypervisor you manage, rather than delegating the VM lifecycle to a [cloud provider](../cloud/). You are responsible for booting the image, attaching storage and networking, and delivering the Ignition config to the guest (for example via QEMU `fw_cfg`, a config-drive, or the hypervisor's guest-info channel).

Some hypervisors are officially covered by the Flatcar test suite (QEMU, libvirt); others are maintained by community contributors and marked *(community support)* in the sidebar.
