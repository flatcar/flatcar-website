---
title: "Releases"
date: 2018-04-17T17:32:59+02:00
draft: false
announcement: true
announcement_bg: "#12172b"
announcement_text_class: "text-light"
announcement_title: "Move to Docker 25"
announcement_message: "
We will begin moving to **Docker 25 (or newer)** in the near future. Among other changes, Docker 25 and above **remove the devicemapper** storage driver. While new provisionings should not be affected by the change, long-lived nodes which use this back-end will break after the update.

* We plan to introduce Docker 25 (or a newer release) in the **Alpha release late July 2024**.

*  We expect the Docker upgrade to **hit Stable in October 2024 the earliest**.


Any nodes using the devicemapper storage driver will lose access to all docker state (local container images and stopped containers) after this update. Please *participate in Beta testing and run Beta canaries* if you suspect you might be affected.
If you are reading this after Docker 25 hits stable in late 2024 and want to keep using Docker 24 while still updating to the latest OS release, please consider masking Docker 25 altogether and using the Docker 24 sysext from our [sysext-bakery](https://github.com/flatcar/sysext-bakery?tab=readme-ov-file#systemd-sysext).
Please find a full, up-to-date list of deprecated and removed features across Docker versions here: [https://github.com/docker/cli/blob/master/docs/deprecated.md](https://github.com/docker/cli/blob/master/docs/deprecated.md)


We will also discuss the docker upgrade and provide status updates in our [Office Hours](https://github.com/flatcar/Flatcar/discussions/categories/flatcar-office-hours?discussions_q=category%3A%22Flatcar+Office+Hours%22+is%3Aopen) and [Developer Sync](https://github.com/flatcar/Flatcar/discussions/categories/flatcar-developer-sync%22+is%3Aopen) calls.
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
