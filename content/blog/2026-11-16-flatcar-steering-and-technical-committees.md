+++
tags = ["flatcar", "governance", "community", "cncf"]
topics = ["Community"]
authors = ["lexi-nadolski", "jan-bronicki"]
title = "Introducing the Flatcar Steering and Technical Committees"
draft = false
description = "Flatcar is forming its first Steering Committee and Technical Committee. Here's what each one does, how they're being formed, and what else has changed."
date = "2026-11-16T10:00:00+00:00"
postImage = "flatcar-path.jpg"
aliases = ["/blog/2026/11/flatcar-steering-and-technical-committees/"]
+++
 
On Friday 16 October 2026, the Flatcar maintainers voted to adopt charters for two new governing bodies: a [Steering Committee](https://github.com/flatcar/Flatcar/blob/main/committees/steering-committee/charter.md) and a [Technical Committee](https://github.com/flatcar/Flatcar/blob/main/committees/technical-committee/charter.md). In early November, they agreed how to form them, and both committees will be seated on 7 December. They give the project structured leadership, with clear owners for its direction and built-in limits on how much any one company can control.
 
## Why we did this
 
Flatcar has been run as a flat hierarchy of maintainers, with the Maintainer Council as its governing body. The committees add something that structure didn't have: clear rules that keep governance balanced across companies.
 
Our [values](https://github.com/flatcar/Flatcar/blob/main/governance.md#values) already put community over product or company, and say that each contributor takes part in the project as an individual. The committee charters put that into practice:
 
- **Steering Committee:** no more than two members from the same company in the founding term. The charter currently sets a tighter limit of one seat per company from the second term onward.
- **Technical Committee:** a deliberately looser limit of no more than four members from the same company, while our contributor base is still concentrated. A tighter limit for later terms is part of the committee's first-year work.
- **Both committees:** every decision needs yes votes from members of at least two different companies, and a company's limit includes its subsidiaries.
- **Governance changes:** once it's seated, the Steering Committee approves changes to our governance, alongside the maintainers.

The committees also give project-wide questions a clear home: who looks after shared assets like the GitHub organisation and website, how architectural decisions that touch many repositories get made, and where to turn when a disagreement is stuck.
 
## What each committee does
 
The **Steering Committee** owns the non-technical direction of the project: its vision, mission and values, its governance and community structure, charters for project-wide groups such as working groups and subgroups, project assets like the GitHub organisation, websites, mailing lists and social accounts, and Flatcar's relationship with the CNCF. It's also the final escalation point for non-technical disputes.
 
The **Technical Committee** owns Flatcar's technical direction and architecture: project-wide technical standards, the process for technical proposals and design reviews, and technical questions that cross more than one repository or subgroup.
 
Day-to-day work stays with the maintainers and their subgroups: reviewing and merging pull requests, running releases, triaging issues, and running CI and tooling all carry on through the normal process, with no committee approval needed. The committees step in when a matter is project-wide or cross-cutting, or when it's escalated to them.
 
## How the committees are formed
 
Both committees start as bootstrap committees, as Kubernetes did in 2017. Instead of a full election, eligible people can put themselves forward on GitHub from 16 to 29 November. After a week for the maintainers to raise any concerns, both committees are seated on 7 December.
 
Maintainers, [Members](https://github.com/flatcar/Flatcar/blob/main/CONTRIBUTOR_LADDER.md), and people who work for, or represent, an organisation listed in [ADOPTERS.md](https://github.com/flatcar/Flatcar/blob/main/ADOPTERS.md) are eligible to stand for either committee. Anyone else who has made multiple meaningful contributions to Flatcar in the last 12 months, technical or not, can also stand after a check by the maintainers. That check looks at what you've contributed, not your job title or employer. Nobody can sit on both committees at the same time.
 
## How the first year works
 
Both committees start with a one-year founding term, using the starting rules set out in their charters. None of this is set in stone: the founding committees will shape the rules for their second term onward, including the number of seats, who can stand and vote, how members are chosen, term limits and company representation, and the charters can keep evolving as the project grows. When Kubernetes started its governance, its [bootstrap committee wrote](https://kubernetes.io/blog/2017/10/Kubernetes-Community-Steering-Committee-Election-Results/) that "we do not believe that we will get it right the first time", and we feel the same. The committees will publish a first full draft around nine months in and open a public comment period before anything is adopted.
 
## Also new this month
 
- **A contributor ladder.** Our governance has always promised "a clear path up the contributor ladder", and now it's written down. The [ladder](https://github.com/flatcar/Flatcar/blob/main/CONTRIBUTOR_LADDER.md) adds a **Member** role between Contributor and Maintainer, for people who take part in Flatcar regularly. New Members are sponsored by two maintainers, and non-code work counts too. A warm welcome to our [first Members](https://github.com/flatcar/Flatcar/blob/main/MEMBERS.md)!
- **A clearer adopters list.** [ADOPTERS.md](https://github.com/flatcar/Flatcar/blob/main/ADOPTERS.md) now follows the CNCF's definition of a direct adopter.
- **Who works on what.** [MAINTAINERS.md](https://github.com/flatcar/Flatcar/blob/main/MAINTAINERS.md) now shows each maintainer's company and the areas they look after.

## Thank you
 
This governance was shaped in the open. Thank you to everyone who commented on the [GitHub discussion](https://github.com/flatcar/Flatcar/discussions/2202), joined the open sessions in July, reviewed drafts and voted. We're looking forward to working with the first committee members.
 
Read the full charters on [GitHub](https://github.com/flatcar/Flatcar/tree/main/committees).
