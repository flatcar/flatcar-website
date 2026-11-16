+++
tags = ["flatcar", "governance", "community", "cncf"]
topics = ["Community"]
authors = ["lexi-nadolski", "jan-bronicki"]
title = "Introducing the Flatcar Steering and Technical Committees"
draft = false
description = "Flatcar is forming its first Steering and Technical Committees. Here's what they do, how they're being formed, and what else has changed in how the project is run."
date = "2026-11-16T10:00:00+00:00"
postImage = "flatcar-path.jpg"
aliases = ["/blog/2026/11/flatcar-steering-and-technical-committees/"]
+++

Flatcar is forming its first Steering Committee and Technical Committee.

In October, the Flatcar maintainers voted to adopt charters for both committees: a [Steering Committee](https://github.com/flatcar/Flatcar/blob/main/committees/steering-committee/charter.md) and a [Technical Committee](https://github.com/flatcar/Flatcar/blob/main/committees/technical-committee/charter.md). In November, they agreed how to get them started. It's one of the biggest changes to how Flatcar is run since the project began, and an important step on our path to CNCF graduation.

## Why we did this

Flatcar has always been governed by a flat group of maintainers, and that has served us well. As the project and its community have grown, though, some questions don't fit neatly into any one subgroup: who looks after project-wide assets, how we make architectural decisions that touch many repositories, and how someone raises a concern when they feel stuck.

The new committees give those questions a clear home, while keeping to the [values in our governance](https://github.com/flatcar/Flatcar/blob/main/governance.md#values): openness, fairness, inclusivity, and community over any single company.

## What each committee does

The **Steering Committee** looks after the non-technical side of the project. That includes governance and community structure, charters for project-wide groups, project assets such as the GitHub organisation, website and social accounts, and Flatcar's relationship with the CNCF.

The **Technical Committee** looks after Flatcar's technical health and direction. That includes architecture, project-wide technical standards, the process for technical proposals, and technical questions that cross more than one subgroup.

Together, the two committees set Flatcar's direction, each in its own area. Day-to-day work stays with the maintainers and subgroups: reviewing and merging, running releases, CI and tooling all carry on exactly as before.

## How the committees are formed

Both committees start as bootstrap committees, as Kubernetes did in 2017. Instead of a full election, maintainers, [Members](https://github.com/flatcar/Flatcar/blob/main/CONTRIBUTOR_LADDER.md) and people from organisations in [ADOPTERS.md](https://github.com/flatcar/Flatcar/blob/main/ADOPTERS.md) can put themselves forward on GitHub from 16 to 29 November. Other regular contributors can become Members through the contributor ladder. After a week for the maintainers to raise any concerns, both committees are seated on 7 December. The founding committees serve for one year. Their first job is to set the rules for future terms, including how elections will work, with a public comment period before anything is adopted.

## No single company in charge

We want Flatcar's governance to be genuinely multi-company, so a few rules are built in from the start:


* No single company can hold more than 40% of the seats on the Steering Committee, or more than four on the Technical Committee, counting its subsidiaries.
* Every committee decision needs yes votes from members of at least two different companies, again counting subsidiaries as one company.
* Once it's seated, the Steering Committee approves changes to our governance, so maintainers don't have to vote on every one.
* Nobody can sit on both committees at once.


## Also new this month

Alongside the committees, we've made two more changes to how the project works:

* **A contributor ladder.** Our governance has always promised "a clear path up the contributor ladder", and now it's written down. The [ladder](https://github.com/flatcar/Flatcar/blob/main/CONTRIBUTOR_LADDER.md) adds a **Member** role between Contributor and Maintainer, for people who take part in Flatcar regularly. Code, docs, triage, talks, events and community work all count, and new Members are sponsored by two maintainers. A warm welcome to our [first Members](https://github.com/flatcar/Flatcar/blob/main/MEMBERS.md)!
* **A clearer adopters list.** [ADOPTERS.md](https://github.com/flatcar/Flatcar/blob/main/ADOPTERS.md) now follows the CNCF's definition of a direct adopter, so it's clear who should be listed.


## None of this is set in stone

Like our code, our governance will keep evolving. When Kubernetes started its governance, its [bootstrap committee wrote](https://kubernetes.io/blog/2017/10/Kubernetes-Community-Steering-Committee-Election-Results/) that "we do not believe that we will get it right the first time, or possibly ever", and we feel the same. Changes go through issues and pull requests, just like code.

## Thank you

This governance was shaped in the open. Thank you to everyone who commented on the [GitHub discussion](https://github.com/flatcar/Flatcar/discussions/2202), joined the open sessions in July, reviewed drafts and voted. We're looking forward to working with the first committee members.

Read the full charters on [GitHub](https://github.com/flatcar/Flatcar/tree/main/committees).
