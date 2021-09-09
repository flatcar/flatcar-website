+++
title = "Flatcar Container Linux enters new era after CoreOS End-of-Life announcement"
tags = ["coreos", "Linux", "flatcar"]
topics = ["Flatcar Container Linux", "Product"]
authors = ["Chris Kuehl"]
description = "Flatcar Container Linux enters and new era after Red Hat announces CoreOS Container Linux End Of Life"
draft = false
date = "2020-02-24T12:10:00-07:00"
postImage = "coreos-eol-flatcar-new-era.jpg"
+++

Almost two years ago, we launched [Flatcar Container Linux](https://www.flatcar-linux.org/), a drop-in replacement for CoreOS Container Linux. Since then, we’ve made almost 200 [releases](https://www.flatcar-linux.org/releases/), added an [experimental edge channel](https://kinvolk.io/blog/2019/05/introducing-the-flatcar-linux-edge-channel/), [released the update server - Nebraska](https://kinvolk.io/blog/2019/11/announcing-the-kinvolk-update-service-and-nebraska-project/), (re-)introduced ARM support (which had been dropped by Red Hat), and [introduced the Kinvolk Flatcar Container Linux Subscription](https://kinvolk.io/blog/2019/11/announcing-the-kinvolk-flatcar-container-linux-subscription/).

But Flatcar Container Linux is about to enter a new era.

## The New Era

Earlier this month, Red Hat announced the [End of Life of CoreOS Container Linux](https://coreos.com/os/eol/) will be May 26th. This was something that had been expected since soon after the [CoreOS acquisition](https://www.redhat.com/en/about/press-releases/red-hat-acquire-coreos-expanding-its-kubernetes-and-containers-leadership) was announced; everyone knew it was coming, but now we have dates.

For Flatcar Container Linux, this means the Kinvolk team will be continuing maintenance and development completely independent of upstream CoreOS. This is something for which we’ve been anticipating and preparing for some time. We have formed a strong OS and Security team, [led by Thilo Fromm](https://kinvolk.io/blog/2019/01/kinvolk-welcomes-thilo-fromm-as-director-of-engineering/), previously technical project manager responsible for AWS’s internal Linux efforts. That team is already building and testing the edge and alpha channels with updated packages and kernels compared with upstream CoreOS. Those updates will flow into the other channels following the usual alpha → beta → stable progression.

For users, a potentially more impactful date is September 1st, after which “published resources related to CoreOS Container Linux will be deleted or made read-only. OS downloads will be removed, CoreUpdate servers will be shut down, and OS images will be removed from AWS, Azure, and Google Compute Engine”.

This means that not only is Flatcar Container Linux the only way for current users of CoreOS Container Linux to go forward with active maintenance and security updates, but they will absolutely have to make that switch before September.

The good news is that the migration to Flatcar is seamless. As many users — like the folks at Mettle — have already [found out](https://medium.com/@swade1987/upgrading-to-flatcar-linux-746751e89ab4), the process can potentially amount to a simple one-line change.

### Committed to the vision

We commit to staying true to the original purpose of CoreOS Container Linux; provide a minimal and secure container OS with automated, atomic updates, available across all platforms, and supported for years to come. We believe, as CoreOS did, that providing a minimal surface area for attack and running the newest stable software are key aspects of systems security.

### Flatcar Roadmap

While Red Hat has continued basic maintenance of CoreOS Container Linux, the reality is that, in terms of new features, the project has stagnated since the acquisition was announced. With its end of life now imminent, it’s now time to start looking forward.

We recently published our high-level plan for the next year. Some highlights on the way are

*   Stable ARM support (already in alpha),
*   Wider platform support,
*   cgroupv2 (hybrid-mode) as default,
*   Increased test coverage to guarantee stability
*   etc.

In addition, we will also be deprecating legacy components such as the kubelet-wrapper and rkt.

## A Linux Company

At Kinvolk, much of our work nowadays revolves around Kubernetes, and we expect that to continue for the foreseeable future. But we see ourselves **_first and foremost as a Linux company_**.

For us, the operating system is not a black-box. We believe the only way to understand a system is to understand all parts of it, including down and into the OS.

We’ve built our team with this mindset. The Kinvolk team is composed of people who feel as comfortable doing Linux kernel or systemd development as they do when deploying a properly configured Kubernetes cluster. In fact, these are often skills found in single individuals.

## An Open Source Company

Kinvolk is uncompromising in its dedication to making all our products fully open source. We believe that a fully open source enterprise stack is the ideal state for everyone. Our mission is to work towards that goal.

In the context of Flatcar Container Linux, we’ve already demonstrated this philosophy by providing a fully open source update server, [Nebraska](https://github.com/kinvolk/nebraska). This was one of the few parts of the system that CoreOS had never made available under an OSS license.

## Gratitude

We are greatly in debt to the CoreOS team. Kinvolk as a company is not only indebted to CoreOS for giving the world the Container Linux concept: Perhaps less well known, our founding project was working with CoreOS to develop [rkt](https://coreos.com/rkt/), the first alternative to the Docker container runtime, which led to the creation of the [Open Container Initiative](https://www.opencontainers.org/). This first project played a major role not just in the industry, but also in establishing Kinvolk’s reputation as a leader in Linux and container technologies.

It would not be an exaggeration to say that Kinvolk exists today because of the confidence CoreOS put in our team, and that is something for which we will always be grateful.

We are also grateful to the many folks within Red Hat and the community of CoreOS users and former employees who have been so supportive of our efforts with Flatcar, as well as our enterprise customers who enable us to fund those efforts. This has been truly something special, and gives us the faith that we can not just sustain but grow the community around Container Linux.

## A base upon which we build

To conclude, we feel like we are in a unique position to continue the CoreOS legacy; a heavy burden we know. Flatcar Container Linux is the first phase of our plans. It provides the ideal base upon which, similar to CoreOS, we can apply our understanding of the Linux kernel and user space to make better systems.