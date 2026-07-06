---
title: Bare Metal
weight: 30
description: This section provides information and guidance on running Flatcar instances in bare-metal environments.
aliases:
    - /docs/latest/installing/bare-metal/
    - ../bare-metal
---

Bare metal deployments install Flatcar directly onto physical hardware, with no hypervisor between the OS and the machine. You are responsible for boot media, network configuration, and disk layout. Flatcar supports several bootstrap paths:

- **[Booting with ISO](./booting-with-iso.md)**: boot from a live image for one-off provisioning or interactive installs.
- **[Booting with PXE](./booting-with-pxe.md)** / **[iPXE](./booting-with-ipxe.md)**: netboot fleets of machines from a network image server.
- **[Installing to disk](./installing-to-disk.md)**: run `flatcar-install` from an existing Linux system to write Flatcar onto a target drive.
- **[Raspberry Pi 4](./raspberry-pi.md)**: a hobbyist favourite; ARM64 image and boot notes for the Pi.
