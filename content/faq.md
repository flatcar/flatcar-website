---
title: FAQ
description: Some answers to common questions
author: Chris Kuehl
date: 2018-03-05T15:07:28+01:00
draft: false
---

## What are the goals of the Flatcar Linux project?

The Flatcar Linux project aims to be an independently built, distributed, and supported Linux distribution designed for container workloads.

We believe the approach that CoreOS pioneered with Container Linux is correct and aim to preserve that.

We also believe the best open source projects are backed and supported by multiple commercial vendors that collaborate together in a mutually beneficial relationship.
The benefits of this collaboration extend to users who receive a more stable and better maintained end product.

## Why fork Container Linux?

Firstly, we love Container Linux and have an abundance of respect for the team that created and maintain it.
We hope this fork is viewed as a sign of respect for what the CoreOS team has created.

Ideally, we would not need to fork a project to support it.
But in order to provide commercial support for a Linux distro, we need to have some control over the build and delivery process.
And to be able to legally deliver it, we have to make changes; removing trademark terms, for example.
Thus, there is no real way that we see to provide the end product without a fork.

## How will Flatcar Linux differ from the upstream project?

We do not foresee Flatcar Linux significantly diverging from the upstream Container Linux project in the near-term.
Changes mostly consist of a set of patches to remove trademarked terms. Ideally, this would continue to be the only changes.

Flatcar Linux will only diverge from the upstream project if fundamental changes are made to it.
In this respect, one can view Flatcar Linux as a guaranteer of the Container Linux project as it is today. 

## What do you mean when you say Flatcar Linux is "independently built"?

We mean that Flatcar Linux is not dependent on upstream binary artifacts, and is fully built from source.
In fact, if Container Linux disappeared tomorrow, it would have very little impact on the Flatcar Linux project.

## How does this affect Container Linux users?

We hope positively. We plan on working with, and on, the upstream project directly which should benefit users of both distro variants.
For users that require it, Flatcar Linux provides an additional commercial support channel going forward.

## What is the significance of the Flatcar Linux name?

A [flatcar](https://en.wikipedia.org/wiki/Flatcar) is the flat, open railcar used to transport containers.

## Can I use Flatcar Linux today?

Yes, and no.
Images do exist and, in fact, we are running our build infrastructure on Flatcar Linux.
But we are currently only making  images and updates available to select parties in this testing phase.
You can [register your interest to be a tester here]().

## How can I test Flatcar Linux images?

We are currently asking those interested in testing to [register their interest here](https://docs.google.com/forms/d/1zferjzZGXN5p0B5tqUy19ye2Igwrgm-sS7Dly8jhb18/).
We will then reach out and provide further information to selected parties.

In time, we will make Flatcar Linux generally available.
You can [sign up for announcements here](https://docs.google.com/forms/d/1zferjzZGXN5p0B5tqUy19ye2Igwrgm-sS7Dly8jhb18/).

## When will Flatcar Linux be generally available?

Once we feel that it has been tested and proven to be reliable by more outside testers, we will make it generally available.
You can [sign up to be a tester](https://docs.google.com/forms/d/1zferjzZGXN5p0B5tqUy19ye2Igwrgm-sS7Dly8jhb18/), or just [sign up to get Flatcar announcements](https://docs.google.com/forms/d/1zferjzZGXN5p0B5tqUy19ye2Igwrgm-sS7Dly8jhb18/).

We are already a "production" user of Flatcar Linux, so hopefully not long. ;)

## But Red Hat stated they will continue to support Container Linux, right?

While our efforts have been accelerated due to the acquisition of CoreOS by Red Hat, our motivation for creating Flatcar Linux is largely independent of that.

Red Hat did make a statement that they would maintain the open source project, which we take as very positive.
We have no idea what kind of plans Red Hat has for Container Linux beyond that.
But we also have no reason to suspect that Red Hat will not be good stewards of the project.

We do take the following comment to mean that Red Hat will not be offering commercial support for Container Linux going forward.
"_Red Hat Enterprise Linux’s content, the foundation of our application ecosystem **will remain our only Linux offering**.
Whereas, some of the delivery mechanisms pioneered by Container Linux will be reviewed by a joint integration team and reconciled with Atomic._"
[⬈](https://www.redhat.com/en/blog/faq-red-hat-acquire-coreos)

## How can I get commercial support for Flatcar Linux?
Kinvolk will offer commercial support and custom engineering services once Flatcar Linux is generally available.
To be notified when commercial support is available, [sign up to to get announcements](https://docs.google.com/forms/d/1zferjzZGXN5p0B5tqUy19ye2Igwrgm-sS7Dly8jhb18/).

## How is Flatcar Linux funded?
All funding and engineering effort has been provided by [Kinvolk](https://kinvolk.io).
Kinvolk is a Linux consulting company and intends to maintain and support the project going forward.
Kinvolk plans to sustain its effort by offering commercial support agreements and custom engineering services around Flatcar Linux and Kubernetes.
Contact Kinvolk for more information at [hello@kinvolk.io](mailto:hello@kinvolk.io).

## Who is Kinvolk?
Kinvolk is a Berlin-based consulting company focused on building and supporting foundational open-source Linux technologies for cloud infrastructure.
Kinvolk is mostly known for its work on and around rkt, Kubernetes, systemd, BPF and the Linux kernel.
