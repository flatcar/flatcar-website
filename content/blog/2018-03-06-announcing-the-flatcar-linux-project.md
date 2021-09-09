+++
authors = ["chris-kuehl"]
date = "2018-03-06T17:05:56+02:00"
description = "Kinvolk announces Flatcar Linux, a fork of Container Linux"
draft = false
tags = ["linux", "containers", "service", "flatcar"]
title = "Announcing the Flatcar Linux project"
categories = ["blog", "announcement"]
postImage =  "flatcar-logo-text.svg"
+++

Today Kinvolk announces [Flatcar Linux](https://flatcar-linux.org), an immutable Linux distribution for containers. With this announcement, Kinvolk is opening the Flatcar Linux project to early testers.
If you are interested in becoming a tester and willing to provide feedback, please [let us know](https://docs.google.com/forms/d/1zferjzZGXN5p0B5tqUy19ye2Igwrgm-sS7Dly8jhb18/).

Flatcar Linux is a friendly fork of [CoreOS' Container Linux](https://coreos.com/os/docs/latest/) and as such, compatible with it.
It is independently built, distributed and supported by the Kinvolk team.

## Why fork Container Linux?

At Kinvolk, we provide support and engineering services for foundational open-source Linux projects used in cloud infrastructure.
Last year we started getting inquiries about providing support for Container Linux.
Since those inquiries, we had been thinking about how we could offer such support.

When we are typically asked to provide support for projects that we do not maintain–a common occurrence–, the process is rather simple.
We work with the upstream maintainers to evaluate whether a change would be acceptable and attempt to get that work into the upstream project.
If that change is not acceptable to the upstream project and a client needs it, we can create a patch set that we maintain and provide our own release builds.
Thus, it is straightforward to provide commercial support for upstream projects.

Providing commercial support for a Linux distribution is more difficult and can not be done without having full control over the means of building, signing and delivering the operating system images and updates.
Thus, our conclusion was that forking the project would be required.

## Why now?

With the announcement of Red Hat's acquisition of CoreOS, many in the cloud native community quickly asked, "What is going to happen to Container Linux?"
We were pleased when [Rob announced](https://groups.google.com/forum/#!topic/coreos-user/GR4YlF2c1dM) Red Hat's commitment to maintaining Container Linux as a community project.
But these events bring up two issues that Flatcar Linux aims to address.

The strongest open source projects have multiple commercial vendors that collaborate together in a mutually beneficial relationship.
This increases the [bus factor](https://en.wikipedia.org/wiki/Bus_factor) for a project.
Container Linux has a bus factor of 1. The introduction of Flatcar Linux brings that to 2.

While we are hopeful that Red Hat is committed to maintaining Container Linux as an open source project, we feel that it is important that open source projects, especially those that are at the core of your system, have strong commercial support.

## Road to general availability

Over the next month or so, we will be going through a testing phase. We will focus on responding to feedback that we receive from testers. We will also concentrate on improving processes and our build and delivery pipeline. Once the team is satisfied that the release images are working well and we are able to reliably deliver images and updates, we will make the project generally available. To receive notification when this happen, [sign up for project updates](https://docs.google.com/forms/d/1zferjzZGXN5p0B5tqUy19ye2Igwrgm-sS7Dly8jhb18/).

## How can I help?

We are looking for help testing builds and providing feedback. Let us know if you'd be able to test images [here](https://docs.google.com/forms/d/1zferjzZGXN5p0B5tqUy19ye2Igwrgm-sS7Dly8jhb18/).

We are also looking for vendors that could donate caching, hosting and other infrastructure services to the project. You can contact us about this at [hello@kinvolk.io](mailto:hello@kinvolk.io).

## More information

For more information, please see the project [FAQ](https://flatcar-linux.org/faq).

Follow [Flatcar Linux](https://twitter.com/flatcar_linux) and [Kinvolk](https://twitter.com/kinvolkio) on Twitter to get updates about the Flatcar Linux project.
