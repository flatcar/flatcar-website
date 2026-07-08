+++
tags = ["flatcar", "docs", "community"]
topics = ["Community", "Documentation"]
authors = ["jan-bronicki"]
title = "A fresh coat of paint for the Flatcar docs"
draft = false
description = "The Flatcar documentation just got a full restructuring around task-based navigation, and the releases page has been rebuilt from the ground up. Here is what changed and how to give feedback."
date = "2026-07-08T10:00:00+00:00"
postImage = "stacks.jpg"
aliases = ["/blog/2026/07/flatcar-docs-restructure/"]
+++

The Flatcar docs at [www.flatcar.org/docs/latest](https://www.flatcar.org/docs/latest/) just went through their biggest structural change since the project's early days. On top of that, [www.flatcar.org/releases](https://www.flatcar.org/releases) has been rebuilt from scratch. This post is a quick tour of what moved, why, and how to tell us when we got something wrong.

## Why we did it

The old structure had grown organically over the years. Content was split across `installing/`, `setup/`, `provisioning/`, `container-runtimes/`, `reference/`, and a handful of other historical buckets, and the boundaries between them had blurred. New users landing on the docs had to guess where to look, and even experienced users were leaning on the search box or muscle memory to get around.

We stepped back and asked a simple question: **what is the reader actually trying to do?** The new information architecture is organized around answers to that question, not around the internal history of the project.

## The new top-level sections

- **Getting Started**: quickstart and the self-paced learning series
- **First Boot & Provisioning**: Butane, Ignition, and image customization
- **OS Configuration**: host, network, and storage configuration
- **System Extensions**: the sysext workflow
- **Deployments**: split cleanly into `bare-metal`, `cloud`, and `virt-options`
- **Orchestration & Container Runtimes**: containers, Kubernetes, clusters
- **Diagnostics and Fixing Issues**: troubleshooting and log collection
- **Nebraska Update Manager & Releases**: Nebraska and the release process
- **Security**: certificate authorities, encryption, hardening
- **Migration from CoreOS Container Linux**: for folks coming from Container Linux
- **Developer Guides**: SDK, kernel modules, release engineering
- **How to Contribute**: how to help improve Flatcar itself

## Releases page rebuild

The [releases page](https://www.flatcar.org/releases) got its own dedicated rewrite in parallel. The page is now easier to scan, the data pipeline behind it is cleaner, and it should be a much better starting point when you want to know what's shipping on Alpha, Beta, Stable, or LTS. Huge thanks to [Uchechukwu Obasi](https://github.com/thisisobate) for driving that part of the work.

## Please tell us what's broken

This was a *huge* refactor. Hundreds of files moved, thousands of links were rewritten, and a handful of pages were merged or retired. However carefully you review that kind of change, some inconsistencies, stale cross-references, or misfiring redirects will slip through.

If you find something wrong:

- File an issue at [github.com/flatcar/Flatcar](https://github.com/flatcar/Flatcar/issues)
- Or come talk to us on [Discord](https://discord.gg/PMYjFUsJyq). The [`#docs-work`](https://discord.com/channels/1483917970110414988/1509227715167916083) channel is a great place to flag things

Small nits and big structural feedback are equally welcome. If a section is in the wrong place for the way *you* work, we would rather hear that now than have people quietly bounce off the docs.

## This is just the start: want to help?

This restructure is the foundation, not the finish line. There's plenty more documentation work ahead, including filling in gaps, writing new guides, and continuing to refine the sections above, and we'd love more hands on it.

If you're interested in contributing to Flatcar's documentation, reach out to us on [Discord](https://discord.gg/PMYjFUsJyq) in [`#docs-work`](https://discord.com/channels/1483917970110414988/1509227715167916083).

## Thank you

This work happened because a bunch of people put real time into it. Big thanks to:

- [Bruce Hamilton](https://github.com/iRaindrop) and [Seth McEvoy](https://github.com/mcevoy-building7), professional technical writers from [Expert Support, The Technical Writing Company](https://www.linkedin.com/company/expert-support/), whose experience shaped the new information architecture
- [Uchechukwu Obasi](https://github.com/thisisobate), who also rebuilt the releases page

And to the [CNCF](https://www.cncf.io/) for the continued support of the Flatcar project.

The docs restructure landed in [PR #599](https://github.com/flatcar/flatcar-website/pull/599) and the releases page rebuild in [PR #605](https://github.com/flatcar/flatcar-website/pull/605), for anyone who wants to read the diff.

Happy exploring, and please keep the feedback coming.
