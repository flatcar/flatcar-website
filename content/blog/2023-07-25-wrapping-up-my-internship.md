+++
tags = ["flatcar", "internship", "community"]
topics = ["Internship", "OpenSource"]
authors = ["krish-jain"]
title = "Summer 2023 - My internship experience"
draft = false
description = "Summer 2023 Internship Krish Jain"
date = "2023-07-25T14:00:00+02:00"
postImage = "/krish-internship.jpeg"
aliases = ["/blog/2023/07/summer-2023-internship/"]
+++


In this blog post, I'll talk about my enriching internship experience with the Flatcar team. I'll give you some insight into what I worked on, what I learnt and some of the highlights of my experience. 

**My work**

I interned with the Flatcar team for 2 months from June 5th till July 25th 2023.

The SparkNotes version: we're a community driven, fully open source, minimal, secure by default and always up-to-date container host Linux distribution. It doesn't feature a package manager (no `apt`!), and all OS components reside in a protected read-only partition. The build system for the OS takes after CoreOS' build system which itself is derived from ChromeOS. 

I was tasked to work with adding a systemd-sysext build tool to the Flatcar Container Linux SDK and using it for a Docker sysext image, migrating from Torcx to it. Torcx is a boot-time addon manager used to ship Docker and Containerd. My project was structured mainly around plumbing efforts around Flatcar. I had the opportunity to not just work with the Flatcar team (distributed between Germany, India, Netherlands and France), but also collaborate and help assist community members. It was a great collaborative experience for me and I was able to work with such a diverse team! 

The OS images we provided were not suitable as base for building Flatcar-specific sysext images: it lacked the package metadata and Portage configuration, in order to keep end user OS image clean. My script now retains this information and allows you to produce systemd-sysexts to extend the system. This script can be used to build a Flatcar sysext image. Recommended to run from image build folder. It was great to see my work on introducing the [build_sysext][build_sysext] script now also being used to build the OEM sysexts (such as for Azure) and being able to review that PR.

I've been working remotely and I believe that this was a great decision on my part! It really helped provide work-life balance and while in-person interaction could be more enriching, the open communication and great feedback loop solved this really.

Along with my work with adding support to building complex programs into sysext images (rather than just static binaries) - released as part of alpha-3654 - , I've had the chance to work on a variety of interesting tasks. I've
- helped fix miscellaneous issues in documentation
- add instructions to use LVM to setup caching (not merged as of now)
- worked with systemd in order to close solved issues that were still open
- given updates on tickets and which commit solved it to enable closing the ticket 
- [add information to ease setting up network configuration][network-configuration]
- [update the architectures documentation to remove a warning stating that a service is enabled but lacks an install section][architectures-doc]
- [helped push for TPM2 support. added preliminary clevis support, the team now just has to update our tests to add a TPM2 device][clevis-support]
- pushed for publishing a container image for sysstat to the Flatcar Github organization (already have a repository on my account, have to just create one on the Flatcar organization)
- [added TLS support to the kernel so if someone wants to TLS software offload to the kernel, they can][tls-support]
- [removed misleading errors in the SDK since we'd transitioned to the SDK container and the SDK packages were no longer published independenly][sdk-errors] 
- [fixed race conditions that arise from when the containerd service assumed services are ready as soon as they start running rather than when they actually accept socket request][notify]
- [updated respective ebuilds and migrate from python3.10 to python3.11 in our profile since older versions do eventually get obsoleted in Gentoo (had to work around dependency conflicts and learnt to leverage the Gentoo toolchain)][python3.10-3.11]

**Technicals**

Systemd-sysext is a novel, secure, image-based technology for extending Linux operating systems by features sets shipped in images. 

As an immutable, image-based operating system, the Flatcar base OS cannot be extended at run-time (this is a feature! not a bug). Security mechanisms aimed at protecting the base OS don't allow for writing to any of the paths where the OS binaries and files reside (the /usr directory and below). We use the systemd and as such can benefit from systemd-sysext which allows a "sysext" system extension - shipped in a filesystem image on its own - to be transparently overlay-mounted on top of /usr/ . 

The end result of this is a "stacked" /usr with files from the extension "on top" and the existing files from the original "/usr" still accessible. Thus, systemd-sysext can be used to extend immutable image-based Linux distributions securley and safely at runtime.

Our entire build system and development happens through Docker containers and we test Flatcar Linux through using Qemu.

**Timeline**

1. Get accustomed to using Flatcar and to understand how the Flatcar SDK works
2. Investigate systemd-sysexts and learn how to generate and apply sysexts to Flatcar manually (I referred to the excellent tutorial ['Deploy software with systemd-sysext by Kai Lüke'][systemd-sysext] from the Flatcar team!)
3. Use the Flatcar SDK, create a first basic sysext for Flatcar. Apply the extension to a live system and verify that it works. I used Ignition to do this.
4. Wrote the script for building a systemd-sysext image for a complex application (Docker - in order to migrate away from Torcx) consisting of various packages, handling their dependencies correctly. 

It took like one week to ramp up, play around with the codebase, understand the big picture and then learn the intricacies. Most of my project involved working with bash and the Gentoo toolchain so I had to familiarize myself with that. Fortunately, there was good documentation and good talks from the CoreOS team which greatly helped me. Once the intern orientation and ramp-up concluded, my actual tasks began. I had short standup meetings with my manager every week where I updated him on my progress and such. 

**Highlights of the internship**

1. Learn how to operate, maintain and develop for a secure image-based Linux distribution
2. Understand the underlying concepts of systemd, in particular with respect to system extension images and apply this knowledge
3. Interact with the Flatcar community, help onboard new users and interact with upstream (such as polkit, systemd)


**Advice to an intern**

- Take ownership of your project and tasks - it will save you a lot of time
- Get to know your team and mentors 
- Try to be a good communicator
- In your 1:1 meetings with your manager don't be afraid to ask if you have a question or concern. They're there to help you. I know it's cliche, but it's true.
- Networking - there are a plethora of great engineers from whom you can seek help, gain insights etc!
- Learn Git and the Unix shell! While I had experience with working with a Unix shell before, I learnt a lot about writing robust bash scripts during my internships. GitHub is a useful tool but often the UI can be misleading.

The weeks did fly by, but it was a blast.

**Recordings:**

* Concluding Flatcar Developer Sync Meeting ([Jul 25][recording]). 
* [Deploy software with systemd-sysext][systemd-sysext]

 [recording]: https://www.youtube.com/watch?v=7JSHXDzGpp0
 [systemd-sysext]: https://media.ccc.de/v/froscon2022-2775-deploy_software_with_systemd-sysext
 [build_sysext]: https://github.com/flatcar/scripts/commit/6380a43b4f37297bd3c7935f1649b3389e5d530e
 [network-configuration]: https://github.com/flatcar/flatcar-docs/commit/4b1108dd9520b346a5423604d5338dcf3c5d28c0
 [architectures-doc]: https://github.com/flatcar/flatcar-docs/commit/c6056f82dd6711ba069acdd04b44ee8d843bdf7c
 [clevis-support]: https://github.com/flatcar/scripts/pull/909
 [tls-support]: https://github.com/flatcar/scripts/commit/7eea8881060542d349dd02196fd14a45af45c910
 [network-configuration]: https://github.com/flatcar/flatcar-docs/commit/4b1108dd9520b346a5423604d5338dcf3c5d28c0
 [sdk-errors]: https://github.com/flatcar/scripts/commit/75904af31949bfbd2066e2470ceb9fc8ca4f9617
 [notify]: https://github.com/flatcar/scripts/pull/866
 [python3.10-3.11]: https://github.com/flatcar/scripts/commit/3ac8d07cb23cbbb8e09b7a8d79b6f1d418c7cf18
