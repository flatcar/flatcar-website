+++
tags = ["flatcar", "linux", "coreos"]
topics = ["flatcar","product"]
authors = ["Vincent Batts"]
title = "Container Linux: Back on Track with Flatcar"
draft = false
description = "Long live Container Linux"
date = "2020-05-27T08:00:00-07:00"
postImage = "flatcar-independence.jpg"
+++


Yesterday, CoreOS Container Linux reached its end of life (EOL). Today marks the beginning of Flatcar Container Linux as an independent Linux distribution. With this comes a certain responsibility, but more notably: an opportunity for Kinvolk and the broader container community.

Just after the EOL announcement this February, Chris [wrote a post](https://kinvolk.io/blog/2020/02/flatcar-container-linux-enters-new-era-after-coreos-end-of-life-announcement/) about what this would mean for Kinvolk and [the Flatcar project](https://kinvolk.io/flatcar-container-linux). Now that the end-of-life has come to pass, I’d like to build on Chris’ post, go further into where we go from here, and the reasons I’m excited to be at Kinvolk.

I [joined Kinvolk very recently](https://kinvolk.io/blog/2020/05/kinvolk-welcomes-vincent-batts-as-cto/). In these first weeks I have spent most of my time speaking with the team, learning about what everyone is working on, and digging into the various Kinvolk projects. In doing so, I’ve formed a fuller picture and appreciation of what Kinvolk is doing as a company. Presence in upstream communities, contributions, and individual use of these technologies is made evident not only how they enhance the state-of-the-art, but also improve the proven patterns.

## Same stability, more rapid innovation

As the original Container Linux, CoreOS introduced a means of delivering both rapid innovation and a stable and secure operating system. Since their acquisition, the stability has remained but the innovation has stagnated considerably. Thus, in this period, CoreOS Container Linux was only fulfilling half of its promise.

Starting with its latest alpha release, Flatcar Container Linux is resuming this innovation aspect. This release will make its way via the standard channel promotion through beta and into the stable channel, bringing a newer kernel. This means for the first time in about 1.5 years, the stable channel is looking forward to more than just a patch release. Other major components like systemd and Docker will also be getting long-awaited updates.

In effect, Flatcar is carrying the mantle of the original CoreOS user experience and fulfilling the expectations that were originally set.

We have heard positive feedback from customers about the benefits of a slower pace Container Linux. This is valuable feedback. Stability is not something that should block access to innovation.

## Business as usual

Resuming pace is the first step. There have been a number of changes in the container space in the past 2+ years. For example, [rkt](https://github.com/rkt/rkt) was archived, [Ignition](https://github.com/coreos/ignition) has changed, additional container runtimes have gained wider adoption, the next kernel LTS release has progressed, BPF has become more established, cgroup v2 has advanced, etc. Over the next months, expect updates to address these deprecations and advancements.

We understand well that we can only do this by ensuring the stability part of the Container Linux promise. We are here for clients and community users to make sure this process goes smoothly. Join the [mailing list](https://groups.google.com/forum/#!forum/flatcar-linux-user) or IRC. And, as always, [file issues](https://github.com/flatcar-linux/flatcar) you find. Your active use of Alpha and Beta in diverse real-world environments is what makes Stable even better for you.

### Project roadmap

This is a community project and we track plans in the [project roadmap](https://github.com/orgs/flatcar-linux/projects/2). If you are looking to know what is happening and how you can contribute to the Flatcar project with code or feedback, this is the place to watch 👀.

## What Flatcar Container Linux means to Kinvolk

Kinvolk is a 100% open source company and is dedicated to staying that way. As a bootstrapped team (no outside investors) of engineers with experience from the kernel and systemd to networking, telemetry and service meshes and everything in-between, it is about as [farm-to-table](https://en.wikipedia.org/wiki/Farm-to-table) as you can get in the tech industry. This, and the very capable and friendly “volks” I get to work with, are what attracted me to join.

This means Kinvolk can focus on building a sustainable, long-term business to deliver on [its mission](https://kinvolk.io/about) of an enterprise-grade Open Cloud Native stack. The Flatcar project is the foundational bedrock on which we build in fulfilling this mission.

Of course, ultimately this must translate into revenue for us, if we are to be able to continue the substantial investment required to maintain Flatcar Container Linux and build a full Open Cloud Native stack on top of it. We believe it is possible to do this in a sustainable way, based on delivering value that end users appreciate, whether that is the insurance policy of an enterprise service-level agreement, hosted offerings like the Kinvolk Update Service, direct access to our team’s domain experts, or taking on custom development projects.

The imperative to build a sustainable business, however, will never take away from our commitment to 100% open source solutions, and to supporting the wider cloud native community of which we are just a small part. Our stewardship of the heritage of CoreOS Container Linux is only one way this manifests itself.

What all this all boils down to is that if you are looking for a way forward now that CoreOS has reached end-of-life, Kinvolk provides the ideal path via Flatcar Container Linux. But for new deployments, Flatcar holds as much promise as CoreOS once did. So hop on for the ride.
