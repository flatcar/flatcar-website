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

Flatcar is configured declaratively at first boot. This section introduces the provisioning tools and workflows used to generate and deliver configuration to new machines.

| Topic | Description |
| --- | --- |
| [Butane](./butane/) | Author Flatcar configurations in YAML and transpile them to Ignition. |
| [Ignition](./ignition/) | Apply first-boot configuration to a new Flatcar instance. |
| [Infrastructure](./infrastructure/) | Use infrastructure tooling such as Terraform with Flatcar. |
| [Image Customization](./customize-image/) | Customize images before first boot when needed. |
| [cl-config](./cl-config/) | Legacy configuration tooling retained for historical reference. |
