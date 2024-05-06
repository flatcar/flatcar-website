+++
tags = ["flatcar", "sysext", "OS extension" ]
topics = ["Image-Based Linux", "OS extensions"]
authors = ["kai-lueke"]
title = "OS innovation with systemd-sysext"
draft = false
description = "The current state of systemd-sysext in Flatcar and the next steps"
date = "2024-04-24T10:22:13+02:00"
postImage = "/stacks.jpg"
aliases = ["/blog/2024/04/os-innovation-with-systemd-sysext/"]
+++

Flatcar Container Linux has a strong focus on backwards compatibility.
Being a continuation of the CoreOS Container Linux project which started
more than 10 years ago, the main design stayed as is. Flatcar ships a
fixed set of software and users should rely on containers for the rest.
This has proven successful but there are some scenarios where one has
to extend Flatcar in ways the original design wasn't intended for.
Luckily, Flatcar still evolves, though, to make it even more suited for
reliable infrastructure automation.

Two examples for cases where the fixed set of software is limiting are
the following. First, to run in cloud environments Flatcar needs to ship
the cloud vendor tools but we can't pack all of them into the base
image. Second, users sometimes need custom versions of Docker/containerd and
other OS-level software that can't be a container itself. When such
additional software is brought in as a bunch of files placed on the root
filesystem, we faced problems with updating them and with the lack of
integration with the base OS. We now have a solution to extend Flatcar
that provides a robust update mechanism and integrates well with the
base OS. 

With [systemd-sysext](https://www.freedesktop.org/software/systemd/man/latest/systemd-sysext.html)
we can overlay extensions on top of the read-only `/usr` partition. This
allows us to address long-standing feature requests and find new
solutions outside of previous compromises. The team has mentioned
systemd-sysext in many conference talks and it is also a constant topic
in the Flatcar Dev Syncs and Office Hours. Being an early adopter, we
contributed missing features and have ideas for outstanding limitations.
In this post we summarize the added systemd-sysext features in Flatcar,
and the changes we expect to make in the future.

**User-provided Software**

While most software is deployed as containers, this is not possible for
certain host-level software such as the container runtime itself. ​So
far, one had to place binaries under `/opt/bin` and keep track of them for
updating, or use Torcx to switch the inbuilt Docker/containerd version
to a custom Torcx bundle. With systemd-sysext there is now a more
generic solution for user-provided software with deep OS-level
integration. Therefore, we recently removed Torcx and recommend using
systemd-sysext for deploying custom Docker/containerd versions.
Flatcar's inbuilt Docker/containerd versions are in fact systemd-sysext
images ​already, so that they will fully disappear when disabled. 

To help users extend Flatcar with systemd-sysext, we provide build
recipes for common software projects and publish prebuilt extension
images in the [sysext-bakery repository](https://github.com/flatcar/sysext-bakery).
Since the lifecycle of the extensions is decoupled from Flatcar OS updates,
user-provided extensions should consist of static binaries instead of
linking against OS libraries. ​Currently​, the published extensions are
based on official release binaries of the various projects. Besides
Docker and containerd, the repository offers extensions providing
binaries for Kubernetes, CRI-O, K3s, Wasmtime, and wasmCloud. Extensions
can be updated with
[systemd-sysupdate](https://www.freedesktop.org/software/systemd/man/latest/systemd-sysupdate.html),
and the sysext-bakery repository
[provides the configuration](https://github.com/flatcar/sysext-bakery?tab=readme-ov-file#consuming-the-published-images)
to set it up. 

The customization of the OS at provisioning time combined with the
ability to update the additions is also interesting for the Kubernetes
Cluster API project. ​Until now, ​the approach has been to prepare custom
images with​ ​[Kubernetes image-builder](https://github.com/kubernetes-sigs/image-builder)
and upload these images to the cloud providers. With ​systemd-sysext, one can
use the Flatcar images available in the cloud marketplaces and deploy
the Kubernetes binaries at provisioning time. The additional benefit of
updating Kubernetes binaries with systemd-sysupdate would then enable
in-place Kubernetes updates. The latest release of the Kubernetes
ClusterAPI for OpenStack (CAPO) provider already supports a
`flatcar-sysext`
[variant](https://cluster-api-openstack.sigs.k8s.io/clusteropenstack/configuration.html#ignition-based-images). 

**Cloud Vendor Tools and Flatcar Extensions**

Another area where systemd-sysext serves as an elegant solution is
providing cloud vendor tools. To make Flatcar work on the various
clouds we often need the OEM images to contain integration software
provided by the cloud vendor. Adding these to the base image would ​waste
disk space for all users and the old approach was to put these binaries
on the Flatcar OEM partition. The problem was that there was no
update/rollback mechanism for the scattered files and the custom
location was also not ideal for a ​good integration due to diverging from
an expected standard path. 

Now the cloud vendor tools in Flatcar are layered on top of ​the ​`/usr`
partition through systemd-sysext images. They are covered by the Flatcar
A/B update/rollback mechanism and provided as additional update payloads
by our [update server](https://github.com/flatcar/nebraska). The
extensions are coupled to the OS version to ensure that they are
compatible ​and, therefore, ​can make use of dynamic linking to save disk
space. 

Having established a mechanism for A/B-updated extensions that are bound
to the OS version, Flatcar has become more modular. In the past we had
to find a compromise between user demands and the image size. The first
optional [Flatcar extension](https://www.flatcar.org/docs/latest/provisioning/sysext/#flatcar-release-extensions)
we introduced provides the kernel drivers and CLI utilities for the ZFS
out-of-tree filesystem. We plan to make more CLI tools available such as
htop or tmux and cover more use cases with a Podman and
[Incus](https://linuxcontainers.org/incus/) extension. The NVIDIA kernel
driver is also a candidate for a Flatcar extension. At the same time we
can look into reducing the base image size by splitting out some less
common parts such as [sssd](https://sssd.io/) and Kerberos into
extensions, likely pre-enabled for backwards compatibility. 

**Looking Forward**

Currently the extensions get loaded quite late in the bootup, where
kernel module settings, udev rules, or systemd target dependencies have
already been processed. This means that the extension needs to work
around this by explicitly applying the required settings. In general,
this behavior is always needed if extensions get loaded after the system
is up, but for ​many software projects the additional modifications
required for live loading might not be worth adding because one can also
require a reboot. To make unmodified software work, we want to mount the
extension overlay ​during​ the initrd stage for the final system to boot
up fully configured. Another limitation is that during an extension
reload the overlay mount shortly disappears. We want to fix this by
using the new [Linux mount beneath API](https://lwn.net/Articles/927491/).
The integrity of extension images can be protected with dm-verity but we need more granular
policies to enforce this for OS extensions by default. For
systemd-sysupdate we want it to run on first boot from the initrd to
download missing extensions. We also think that downgrade support in the
manifest format would be beneficial to retract a broken update. 

**Managing Configuration and Building a Bridge to Traditional Distros**

With
[systemd-confext](https://www.freedesktop.org/software/systemd/man/latest/systemd-confext.html)
users can load extension images for `/etc`, thus managing their
configuration in a reliable way. Up to now, the overlay mount was
strictly read-only which doesn't yet work well for all use cases. Also,
Flatcar already has an overlay mount for `/etc` which provides the default
configuration files of the active `/usr` partition, which keeps `/etc`
updated without accumulating old state. A file is only copied to the
original `/etc` directory on the root filesystem when it gets modified by the user.
To make use of systemd-confext we contributed a mutable overlay mode to
systemd-confext and systemd-sysext. This way we can soon switch the
custom `/etc` overlay to provide the default configuration through a
systemd-confext image. The mutable mode where the original directory
becomes the upperdir of the overlay mount is also what is needed to load
systemd-sysext images on traditional Linux distributions where `/usr` must be writable
for the package manager. 

**Conclusion**

The use of systemd-sysext in Flatcar lets us innovate in the design of
the image-based OS. ​If you are​ interested in these new developments,
then good news, many features are already available in the Flatcar
Stable channel, and others are staged in the Alpha and Beta channels.
The ​foundation is prepared, and we want to build on it to split Flatcar
into composable OS layers. There are still some rough ​edges, but users
are encouraged to try the new systemd-sysext features and contribute
more extensions to the [sysext-bakery repository](https://github.com/flatcar/sysext-bakery). Help is also
welcome with the planned Flatcar extensions and the upstream
improvements for systemd-sysext. We hope that the mutable overlay mode
will make systemd-sysext and systemd-confext more accessible for
traditional distributions. 

In summary, making Flatcar more modular addresses many pain points while
keeping the valued simplicity and reliability. The optional OS
layers differ fundamentally from a package manager system and are not
meant to be used like one. We hope that systemd-sysext grows to address
more corner cases and gains adoption in other Linux distributions. The
next iteration of the [Image-based Linux Summit](https://lwn.net/Articles/946526/)
and the ["All Systems Go!"](https://all-systems-go.io/) conference
are good community spaces to discuss this. In the meantime, feel free to
join the [Flatcar Office Hours](https://github.com/flatcar/Flatcar/?tab=readme-ov-file#monthly-office-hours-and-developer-syncs)
and [Matrix](https://app.element.io/#/room/%23flatcar:matrix.org) chat
to bring up your use case. 
