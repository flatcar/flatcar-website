+++
tags = ["flatcar", "torcx", "sysext", "OS extension" ]
topics = ["Image-Based Linux", "OS extensions"]
authors = ["thilo-fromm"]
title = "Extending Flatcar: Say 'Goodbye' to torcx and 'Hello' to systemd-sysext."
draft = false
description = "Replacing the legacy torcx OS image extension mechanism with sysext."
date = "2023-12-18T10:22:13+02:00"
postImage = "/torxes.jpg"
aliases = ["/blog/2023/12/torcx-deprecation-for-systemd-sysext/"]
+++

Flatcar is a minimal, immutable, image-based operating system for fully automated, zero-touch container infrastructure.
It ships the bare minimum required for running containers at scale - and usually, the answer to questions like "how do I install tool XYZ on Flatcar?" is: "run it in a container".
Sometimes though, "tool XYZ" needs to operate close to the OS itself, and it's not feasible (or even outright impossible) to run it in a container.
Good examples for such tools and applications are custom container run-times like podman, complex control planes like Kubernetes, and vendor-specific ("guest") tools that are only useful in specific environments.

Prior to our adoption of systemd-sysext, all of these OS customisations and extensions were handled by different, separate mechanisms.
One of these legacy mechanisms - the one that allowed (within tight limits) to customise the container runtime - was [torcx](https://github.com/flatcar/torcx).
Even though in theory, torcx can handle arbitrary applications, it was only ever used to ship and to support more than one docker version per OS release.
It's a very specific tool  - it's unlikely you've ever heard of it, let alone used it.

Torcx-managed applications are built into a tarball, which is either added to the base OS image or can be downloaded at provisioning time from a HTTPS source.
A torcx "manifest" - a JSON definition of what source (local or remote) to use for which torcx-managed application - is shipped with the operating system, and can be overridden by a user-defined manifest at provisioning time, thus allowing customisations.
Torcx-managed applications are represented in the OS by means of wrapper scripts - conceptionally not unlike the [Debian Alternatives](https://wiki.debian.org/DebianAlternatives) tool, but with scripts instead of symlinks.
At early boot, torcx unpacks all torcx-managed applications from the sources / versions that have been defined in the manifests.
The wrapper scripts can then be called to run the respective binaries.

This approach has, compared to systemd-sysext, multiple drawbacks:
- Wrapper scripts need to be baked into the base OS to represent the binaries of torcx-managed applications.
  After the OS image is built, it's not possible to add or modify torcx-managed applications.
  In other words, users are restricted to customising docker versions when using the official Flatcar releases, and required to build their own images (and maintain their own OS update infrastructure) for other modifications.
- Torcx applications require special build and packaging since binaries and libraries reside in non-standard paths, increasing maintenance effort required to keep apps up to date (as upstream Gentoo ebuilds cannot easily be used).
- Torcx-managed application packages were extracted (and possibly downloaded) at early boot, prolonging the boot process.
  Furthermore, extracted binaries were stored in an ephemeral ramdisk, increasing memory footprint.
- Updating torcx-managed applications required a change of the manifest (to point to the new version) which would either require re-provisioning or modifying the torcx manifest on nodes, causing config drift.

Also, the Flatcar docs have been recommending [downloading plain docker / containerd binaries](https://www.flatcar.org/docs/latest/container-runtimes/use-a-custom-docker-or-containerd-version/) instead of using torcx for customising docker for quite a while.

For almost two years, torcx was only used in Flatcar to ship a single docker version - with all of the drawbacks listed above.
With the advent of systemd-sysext, we will deprecate torcx and remove it from Flatcar in early 2024.


**Sysext to the rescue**

If you want to try our new sysext-based composed images yourself, have a look at the latest Alpha releases - these don't ship torcx anymore, and include docker and containerd as sysexts instead.

Sysexts have the following advantages:
- Do not require changes in the base OS image.
  Sysexts can ship arbitrary applications and libraries, and will integrate seamlessly into the base OS via overlay mounts.
- Are easy to integrate in the build system as binaries do not need special handling.
- Apply / merge faster into the OS via overlayfs, and do not consume additional memory for storage.
- Can be updated independently of the base OS by use of systemd-sysupdate.
  This way, custom docker installations can be kept up to date by users without the need to re-provision nodes.
  (Note that docker and containerd shipped with the base OS will continue to be updated as part of the base OS.)
- Both containerd and docker can be disabled via ignition configs simply by overriding respective symlinks from `/etc/extensions/...`.
  This can be useful when shipping a custom container runtime (or in cases where docker is simply not used).
  When disabled, the respective binaries and libraries are not merged, and are missing from the OS filesystem.

Starting with [Alpha-3794.0.0](https://www.flatcar.org/releases#release-3794.0.0), containerd and docker are included in the base OS image as sysexts.
This means that in the regular Flatcar base OS image, there are no `containerd` or `docker` binaries in `/usr/bin` (where formerly the torcx wrapper scripts resided) - check out the [OS image contents](https://alpha.release.flatcar-linux.net/amd64-usr/current/flatcar_production_image_contents.txt) yourself!
Instead, you'll find `containerd-flatcar.raw` and `docker-flatcar.raw` in `/usr/share/flatcar/sysext/`, and respective symlinks in `/usr/share/flatcar/etc/extensions/` (which is merged into `/etc/` at boot).


**That's all well and good, but what does that mean for Flatcar users?**

We aim for a seamless transition and have invested into significant test coverage to ensure user workloads are not disrupted by the change.
Users will continue to enjoy a robust container OS experience, and do not need to do anything to adopt to the new system.

As stated above, it is highly unlikely anyone outside the legacy OS builds even make use of torcx (or heard of it, for that matter).
Just to be on the safe side, we will continue to loudly announce the move to sysext throughout the next releases, i.e. when the torcx removal will go Beta, and later graduate to Stable.

Should you, against all probability, indeed make use of torcx customisations in your deployments, then we'd like to hear from you!
It should be really straightforward migrating the customisations to sysext, and chances are high that adapting sysext will improve your maintenance and operations experience just as it did for us.
Please reach out to us via our [issue tracker](https://github.com/flatcar/Flatcar/issues/new/choose), [Matrix](https://app.element.io/#/room/#flatcar:matrix.org) or [Slack](https://kubernetes.slack.com/archives/C03GQ8B5XNJ) chat, or join our [office hours](https://github.com/flatcar/Flatcar/discussions/categories/flatcar-office-hours) for a face-to-face chat!

**Docker 24 incoming**

On a closing note, moving from custom torcx docker / containerd ebuilds to upstream Gentoo ones significantly eases the maintenance burden and makes integration of major version updates significantly easier.
So the new Alpha versions also ship docker 24, which is a major version bump from version 20 currently in Beta and Stable, as well as the latest containerd.

We also expect future releases to upgrade to new major versions significantly faster.
