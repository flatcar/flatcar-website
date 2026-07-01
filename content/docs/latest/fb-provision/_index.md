---
title: First Boot & Provisioning
description: >
  Several different tools can be used to automate the provisioning of
  Flatcar Container Linux images. These guides can help you understand what
  each of the tools do, as well as provide plenty of examples of how to use
  them.
weight: 20
aliases:
  - /docs/latest/provisioning/
---

# Flatcar First Boot & Provisioning

Flatcar is configured at **first boot only** via declarative config. The primary toolchain is: **Butane YAML → Ignition JSON → applied by Ignition in initramfs**.

This section describes the following provisioning tools and configuration tasks:

| Tool or Task | Description |
| --- | --- |
| [Butane](./butane/_index.md) | Butane transforms a user-provided Butane Configuration into an Ignition configuration. |
| [cl-config] | (DEPRICATED) YAML configuration format used to generate Ignition configs.|
| [Customize image](./customize-image/_index.md) | Describes mounting a partition for customization. |
| [Ignition](./ignition/_index.md) | Provisioning utility specially designed for Container OSs. |
| 
