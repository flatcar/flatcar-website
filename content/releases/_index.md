---
title: "Releases"
date: 2018-04-17T17:32:59+02:00
draft: false
announcement: true
announcement_bg: "#12172b"
announcement_text_class: "text-light"
announcement_title: "⚠️ End of support for CGroupsV1 in early 2025 ⚠️"
announcement_message: "

Flatcar will stop supporting the cgroups v1 backwards compatibility mode in Q1 2025.
With our adoption of systemd-256, support for legacy CGroupsV1 will end in Alpha, Beta, and eventually Stable.
[Enabling legacy CGroupsV1 during deployment](https://www.flatcar.org/docs/latest/container-runtimes/switching-to-unified-cgroups/#starting-new-nodes-with-legacy-cgroups) will not be supported anymore.
Nodes that use CGroupsV1 legacy mode will fail to update. This ensures your workloads will not be disrupted. Enable CGroupsV2 on your legacy CGroupsV1 nodes in order to successfully update.

LTS-2024 will support CGroupsV1 until late 2025.

We will regularly call out and discuss CGroupsV1 retirement in our [Office Hours](https://github.com/flatcar/Flatcar/discussions/categories/flatcar-office-hours?discussions_q=category%3A%22Flatcar+Office+Hours%22+is%3Aopen) and [Developer Sync](https://github.com/flatcar/Flatcar/discussions/categories/flatcar-developer-sync%22+is%3Aopen) calls.
"

channels:
  - name: stable
    title: Stable
    description: >
      The Stable channel is intended for use in production clusters. Versions of Flatcar Container Linux have been tested as they move through Alpha and Beta channels before being promoted to stable.
  - name: beta
    title: Beta
    description: >
      The Beta channel is where Flatcar Container Linux stability is solidified. We encourage including some beta machines in production clusters in order to catch any issues that may arise with your setup.
  - name: alpha
    title: Alpha
    description: >
      The Alpha channel follows a more frequent release cadence and is where new updates are introduced. Users can try the new versions of the Linux kernel, systemd and other core packages.
  - name: lts
    title: LTS
    description: >
      LTS release streams will be maintained for an extended lifetime of 18 months. The yearly LTS streams have an overlap of 6 months.
menu:
  flatcar:
    weight: 10
  flatcarpro:
    weight: 20
---
