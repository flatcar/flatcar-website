---
title: "Sysext Tutorial: From Concept to Custom Extension"
linktitle: Tutorial
description: A hands-on, end-to-end guide to systemd-sysext on Flatcar — from understanding the concept through building and deploying your own custom extension.
weight: 5
---

This tutorial covers the full **systemd-sysext** lifecycle on Flatcar Container Linux. By the end you will know how to:

- Use official and community extensions shipped with Flatcar
- Build your own custom sysext image from scratch
- Test extensions locally in a QEMU VM before deploying
- Deploy extensions automatically at boot with Ignition

## Who this is for

Anyone comfortable with Linux who is new to image-based, immutable operating systems and systemd-sysext. No prior Flatcar experience is required.

## Tutorial parts

| Part | Topic |
|------|-------|
| [1 — Understanding sysext](./understanding-sysext/) | What sysext is, extension types, how overlays work |
| [2 — Using official extensions](./using-official-extensions/) | Enabling, deploying, and verifying official extensions |
| [3 — Building your first custom extension](./building-custom-extension/) | Step-by-step: package a tool into a `.raw` image |
| [4 — Testing locally](./testing-locally/) | Boot QEMU, load your extension, debug failures |
| [5 — Production deployment](./production-deployment/) | Ignition provisioning, hosting, and auto-updates |
| [6 — Contributing to sysext-bakery](./contributing-to-bakery/) | Turn your recipe into a reusable bakery extension |
