+++
tags = ["flatcar", "stable", "release" ]
topics = ["stable", "release"]
authors = ["flatcar-maintainers"]
title = "What's new in Stable 3975.2.0"
draft = false
description = "What's new shipping with the new major release of Stable 3975.2.0"
date = "2024-08-07T00:00:00+00:00"
postImage = "/sewing-machine.jpg"
aliases = ["/blog/2024/08/whats-new-in-stable-3975-2-0/"]
+++


## What's new?

Stable 3975.2.0 introduces a wide range of features, packages updates, and security fixes. The major release focusses on introducing support for new vendors, new officially maintained sysexts.

### New vendors

Over the past few months, the team has continued to invest in Flatcar support on cloud providers, enhancing existing support with better documentation and an improved user experience. Flatcar Stable now supports Hetzner and Scaleway, as well as KubeVirt images.

### Sysext

Docker and Containerd have been available on Flatcar as sysext images for a while now. The Flatcar team now provides official sysext images that can be enabled at boot on Flatcar. These images are built in Flatcar CI and are officially maintained. Starting from this Stable release, you will be able to run ZFS or Podman systemd sysext extensions, with more sysext extensions to follow (e.g., Python). Flatcar sysext images are now split into two categories:

- Official:
  - enabled by default: Docker, Containerd, OEM
  - disabled: Podman, ZFS
- Community supported: from the Flatcar sysext-bakery: https://github.com/flatcar/sysext-bakery

Browse the documentation for more information: https://www.flatcar.org/docs/latest/provisioning/sysext/#types-of-systemd-sysext-images

### Kernel & TPM

With the Stable release, we bump the Linux kernel version from 6.1 stream to 6.6. The release also introduces a long-awaited feature of disk-encyption 🔒. With this release, you can perform for TPM-backed disk encryption with systemd-cryptenroll and Clevis, and with a network-backed disk secret store with Tang.

### Metrics & Contributions

More than 2000 commits on Stable 3975.2.0 by 24+ contributors, among them 7 are new contributors. 👏

## Getting Involved
- Even if new major Stable are being tested and validated since several months on Beta channel, it remains possible for your workload to show some trouble. In such a case, please open an issue on the Flatcar [tracker](https://github.com/flatcar/Flatcar/issues/new?assignees=&labels=kind%2Fbug&projects=&template=bug_report.md&title=)
- Join the Flatcar [Matrix](https://app.element.io/#/room/#flatcar:matrix.org) or on [Slack](https://kubernetes.slack.com/archives/C03GQ8B5XNJ).
- Add 📅 [Google Calendar](https://calendar.google.com/calendar/u/0/embed?src=c_ii991mqrpta9en8o7ofd4v19g4@group.calendar.google.com)([iCal](https://calendar.google.com/calendar/ical/c_ii991mqrpta9en8o7ofd4v19g4%40group.calendar.google.com/public/basic.ics)) with both our Office Hours and Developer Sync meeting series. We would love you to come join us in these meetings.
- Watch and 🌟 star the project on [GitHub](https://github.com/flatcar/Flatcar). This is a great way to show your appreciation for the project and the maintainers 💖
- As we grow, we would like to know our community and who are using Flatcar. If you are using Flatcar in your company, please add your company as a [Flatcar](https://github.com/flatcar/Flatcar/blob/main/ADOPTERS.md) Adopter on GitHub.

---
_Cover Image by [@towel.studio](https://unsplash.com/photos/a-close-up-of-a-machine-working-on-a-piece-of-fabric-IYhFK0bne7Y)_
