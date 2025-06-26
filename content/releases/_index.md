---
title: "Releases"
date: 2018-04-17T17:32:59+02:00
draft: false
announcement: true
announcement_bg: "#12172b"
announcement_text_class: "text-light"
announcement_title: "⚠️ End of support for CGroupsV1 in Stable 4230.2.0 release ⚠️"
announcement_message: "
With the Flatcar Container Linux 4230.2.0 Stable release, CGroups V1 backward
compatibility has been removed. Enabling legacy CGroupsV1 during deployment is
no longer supported, and nodes still using CGroupsV1 will fail to update. This
change ensures your workloads are not unexpectedly disrupted. We encourage you
to enable CGroupsV2 on legacy CGroupsV1 nodes to ensure successful updates. The
LTS-2024 channel (major release series 4081) will continue supporting CGroupsV1. This channel will receive regular updates until early 2026, and hit EOL in mid-2026.

If you have any questions, feel free to join our [Matrix
channel](https://app.element.io/#/room/#flatcar:matrix.org), or participate in
our [Office Hours](https://meet.flatcar.org/OfficeHours) / [Developer
Sync](https://meet.flatcar.org/OfficeHours) calls.
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
