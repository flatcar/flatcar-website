---
title: FAQ
description: Some answers to common questions
author: Chris Kuehl
date: 2020-04-03T14:10:52+02:00
draft: false
---

## What are the goals of the Flatcar Container Linux project?

The Flatcar Container Linux project aims to be an independently built, distributed, and supported Linux distribution designed for container workloads.

We believe the approach that CoreOS pioneered with CoreOS Container Linux is correct and aim to preserve that.

We also believe the best open source projects are backed and supported by multiple commercial vendors that collaborate together in a mutually beneficial relationship.
The benefits of this collaboration extend to users who receive a more stable and better maintained end product.

## How does Flatcar Container Linux differ from CoreOS Container Linux?

**TODO: This answer is obsolete, we need a completely new answer here**.

We do not foresee Flatcar Container Linux significantly diverging from the upstream CoreOS Container Linux project in the near-term.
Changes mostly consist of a set of patches to remove trademarked terms. Ideally, this would continue to be the only changes.

Flatcar Container Linux will only diverge from the upstream project if fundamental changes are made to it.
In this respect, one can view Flatcar Container Linux as a guaranteer of the CoreOS Container Linux project as it is today. 

## What will happen with Flatcar Container Linux now that CoreOS Container Linux is discontinuing support?

**TODO: Review both question and answer (the answers are patchwork from previous questions)**

We support Flatcar Container Linux today and plan to continue supporting Flatcar Container Linux as a drop-in replacement for CoreOS Container Linux.

For users that require it, Flatcar Container Linux provides an additional commercial support channel going forward.

## What is the Flatcar Container Linux Edge channel?

The Flatcar Car Linux Edge channel is new channel that includes experimental features and patches of the Linux kernel and other core OS packages.
It's intended to ease the deliver and promotion of new Linux technologies into Kubernetes and other Cloud Native technologies.
You can read more about this in the [Flatcar Container Linux Edge channel announcement](https://kinvolk.io/blog/2019/05/introducing-the-flatcar-linux-edge-channel/).

## What do you mean when you say Flatcar Container Linux is "independently built"?

**TODO: this answer needs to be updated**

We mean that Flatcar Container Linux is not dependent on upstream binary artifacts, and is fully built from source.
In fact, if CoreOS Container Linux disappeared tomorrow, it would have very little impact on the Flatcar Container Linux project.

## What is the significance of the Flatcar Container Linux name?

A [flatcar](https://en.wikipedia.org/wiki/Flatcar) is the flat, open railcar used to transport containers.

## Can I use Flatcar Container Linux today?

Yes! You can consult [the documentation](https://docs.flatcar-linux.org/) on how to use Flatcar Container Linux or go straight to the [release page](https://www.flatcar-linux.org/releases/) for links to each channel.

## How can I get commercial support for Flatcar Container Linux?

Kinvolk offers commercial support and custom engineering services around Flatcar Container Linux. Initially, we are offering support for customers running more than 100 nodes. At a later date, we will introduce general support.

Contact Kinvolk for more information at [hello@kinvolk.io](mailto:hello@kinvolk.io).

## How is Flatcar Container Linux funded?

**TODO: should this say "sustains" instead of "plans to sustain"?**

All funding and engineering effort has been provided by [Kinvolk](https://kinvolk.io).

Kinvolk is a Linux consulting company and intends to maintain and support the project going forward.
Kinvolk plans to sustain its effort by offering commercial support agreements and custom engineering services around Flatcar Container Linux and Kubernetes.

## Who is Kinvolk?

Kinvolk is a Berlin-based consulting company focused on building and supporting foundational open-source Linux technologies for cloud infrastructure.

Kinvolk is mostly known for its work on and around rkt, Kubernetes, systemd, BPF and the Linux kernel.
