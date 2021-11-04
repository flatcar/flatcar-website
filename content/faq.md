---
title: FAQ
description: Some answers to common questions
author: Chris Kuehl, Thilo Fromm, Margarita Manterola
date: 2020-04-03T14:10:52+02:00
draft: false
---

### How will [Kinvolk’s acquisition by Microsoft](https://kinvolk.io/blog/2021/04/microsoft-acquires-kinvolk/) impact the Flatcar project?

Microsoft and Kinvolk are fully committed to the Flatcar Container Linux user community, and to ensuring continuity for users who have already gone through a lot of upheaval over the past couple of years. In fact, we are committed to doubling down on the Flatcar community: we want to expand the universe of partners, contributors, and users, to ensure a vibrant, successful and sustainable long-term future for Flatcar as a truly open, community-driven project.

### What are the goals of the Flatcar Container Linux project?

The Flatcar Container Linux project delivers a fully supported Linux distribution optimized for container workloads.

We believe the approach that CoreOS pioneered with CoreOS Container Linux is correct and aim to preserve that.

### Why use a Container Linux instead of a general purpose Linux distribution?

The OS image shipped by Flatcar Container Linux includes just the minimal amount of tools to run container workloads. This means that the attack surface is significantly reduced.

On top of this, as the OS image is immutable (`/usr` is a read-only partition and there's no package manager to install packages), which means there's less chance of both accidental and intentional breakage.

### If the image is immutable, how does it get updated?

Flatcar uses the `USR-A` and `USR-B` update mechanism, first introduced by ChromeOS. There are two partitions where the `/usr/` filesystem can be deployed. One of them is used as the active `/usr` filesystem, while the other stays in stand-by.

When a new Flatcar Container Linux version is released, the update payload is deployed to the inactive `/usr/` partition. The next time the machine reboots, it mounts this other partition and boots into a fully updated system.

If for any reason something goes wrong during the boot process, the system automatically falls back to the previous `/usr/` partition.

### How do I get started with Flatcar Container Linux?

You can deploy Flatcar Container Linux on a wide array of platforms. Consult [the documentation](https://kinvolk.io/docs/flatcar-container-linux) on how to use Flatcar Container Linux.

Check out our [release page](https://flatcar-linux.org/releases/) to see the latest changes on each channel.

### How does Flatcar Container Linux differ from CoreOS Container Linux?

The main difference is that Flatcar Container Linux is still maintained, while CoreOS Container Linux has been discontinued. Flatcar Container Linux is a drop-in replacement for CoreOS Container Linux. Any minor changes you may need to consider are documented in the [migration documentation](https://flatcar-linux.org/docs/latest/migrating-from-coreos/).

### What are the plans for Flatcar Container Linux now that CoreOS has reached EOL?

CoreOS Container Linux was [discontinued in 2020](https://coreos.com/os/eol/#timeline). Flatcar Container Linux understands itself as the successor in spirit and will continue following the philosophy pioneered by CoreOS, delivering a fully open source, minimal-footprint, secure by default and always up-to-date Linux distribution for running containers at scale.

We will continue to actively develop and support Flatcar Container Linux; updating key components such as the Linux kernel, systemd and Docker. We will also maintain support for Flatcar Container Linux as a drop-in replacement for CoreOS Container Linux for an extended migration period.

### What is the significance of the Flatcar Container Linux name?

A [flatcar](https://en.wikipedia.org/wiki/Flatcar) is the flat, open railcar used to transport containers.
