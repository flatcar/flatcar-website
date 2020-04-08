---
title: FAQ
description: Some answers to common questions
author: Chris Kuehl, Thilo Fromm, Margarita Manterola
date: 2020-04-03T14:10:52+02:00
draft: false
---

## What are the goals of the Flatcar Container Linux project?

The Flatcar Container Linux project delivers an independently built, distributed, and supported Linux distribution designed for container workloads.

We believe the approach that CoreOS pioneered with CoreOS Container Linux is correct and aim to preserve that.

We also believe the best open source projects are backed and supported by multiple commercial vendors that collaborate together in a mutually beneficial relationship.
The benefits of this collaboration extend to users who receive a more stable and better maintained end product.

## How does Flatcar Container Linux differ from CoreOS Container Linux?

It doesn't in any significant way. Flatcar Container Linux is a drop-in replacement for the EOL'd CoreOS Container Linux. Any minor changes you may need to consider are documented in the [migration documentation](https://docs.flatcar-linux.org/os/migrate-from-container-linux/).

## Now that Red Hat has announced that CoreOS Container Linux is reaching end-of-life on May 26th, what are the plans for Flatcar Container Linux?

CoreOS Container Linux maintenance will be discontinued from May 26th, 2020, and publicly available binaries and images will be un-published September 1st, 2020 (see [CoreOS announcement](https://coreos.com/os/eol/#timeline)). Flatcar Container Linux understands itself as the successor in spirit and will continue following the philosophy pioneered by CoreOS, delivering a fully open source, minimal-footprint, secure by default and always up-to-date Linux distribution for running containers at scale.

We will continue to actively develop and support Flatcar Container Linux; updating key components such as the Linux kernel, systemd and Docker. We will also maintain support for Flatcar Container Linux as a drop-in replacement for CoreOS Container Linux for an extended migration period.

For users that require it, Kinvolk also offers commercial support subscriptions. Please reach out to [hello@kinvolk.io](mailto:hello@kinvolk.io) for more information.

## What is the Flatcar Container Linux Edge channel?

The Flatcar Container Linux Edge channel is new channel that includes experimental features and patches of the Linux kernel and other core OS packages.
It's intended to ease the deliver and promotion of new Linux technologies into Kubernetes and other Cloud Native technologies.
You can read more about this in the [Flatcar Container Linux Edge channel announcement](https://kinvolk.io/blog/2019/05/introducing-the-flatcar-linux-edge-channel/).

## What do you mean when you say Flatcar Container Linux is "independently built"?

We mean that Flatcar Container Linux will continue to be updated and maintained after CoreOS Container Linux EOL, and is not dependent on any CoreOS Container Linux binary artifact.

## What is the significance of the Flatcar Container Linux name?

A [flatcar](https://en.wikipedia.org/wiki/Flatcar) is the flat, open railcar used to transport containers.

## Can I use Flatcar Container Linux today?

Yes! You can consult [the documentation](https://docs.flatcar-linux.org/) on how to use Flatcar Container Linux or go straight to the [release page](https://www.flatcar-linux.org/releases/) for links to each channel.

## How can I get commercial support for Flatcar Container Linux?

Kinvolk offers commercial support and custom engineering services around Flatcar Container Linux. Initially, we are offering support for customers running more than 100 nodes. At a later date, we will introduce general support.

Contact Kinvolk for more information at [hello@kinvolk.io](mailto:hello@kinvolk.io).

## How is Flatcar Container Linux funded?

The main funding and engineering effort has been provided by [Kinvolk](https://kinvolk.io).

Kinvolk is a Linux consulting company and intends to maintain and support the project going forward.
Kinvolk sustains its effort by offering commercial support agreements for Flatcar Container Linux.

The Flatcar Container Linux open source project furthermore as a number of corporate sponsors. If your organization would like to become a sponsor, contact us at [hello@kinvolk.io](mailto:hello@kinvolk.io?subject=I%20want %20to%20sponsor%20Flatcar%20Container%20Linux).

## Who is Kinvolk?

Kinvolk is a Berlin-based consulting company focused on building and supporting foundational open-source Linux technologies for cloud infrastructure.

Kinvolk is mostly known for its work on and around rkt, Kubernetes, systemd, BPF and the Linux kernel.
