---
title: Cloud Providers
weight: 10
description: >
  This section provides information and guidance on running Flatcar
  instances in different cloud environments.
aliases:
    - /docs/latest/installing/cloud/
    - ../cloud-providers
---

Cloud providers run and manage the VM lifecycle on your behalf. You select a Flatcar image published to the provider and pass an Ignition config via `user-data`; the platform handles hardware, network, storage, and instance boot. This is the lowest-effort path to running Flatcar in production.

Officially supported providers are covered by the Flatcar test suite. Community-supported providers are maintained by contributors on a best-effort basis and are marked *(community support)* in the sidebar and on their individual pages.
