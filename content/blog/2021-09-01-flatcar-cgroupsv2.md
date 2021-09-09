+++
tags = ["flatcar", "kubernetes", "cgroups"]
topics = ["Linux", "cgroups"]
authors = ["jeremi-piotrowski"]
title = "Flatcar Linux is moving to CGroupsV2"
draft = false
description = "Flatcar Linux is moving to CGroupsV2"
date = "2021-09-01T20:00:00+02:00"
postImage = "/train-passing-by.jpg"
+++

[Flatcar Linux v2969.0.0](https://kinvolk.io/flatcar-container-linux/releases/#release-2969.0.0) was released to the Alpha channel on Aug 19, 2021. This release brings a big change to the underlying configuration of the OS: the default control groups hierarchy has been switched to CGroupsV2. This blog post explains why these changes are necessary and how they will impact users.

# cgroup
Linux namespaces and control groups (or cgroups) are the core building blocks of containers on Linux. Cgroups restrict the resources (CPU, memory, I/O) that a process or container can consume, which is essential to securely hosting diverse workloads on the same system.

Cgroups were merged into the Linux kernel in 2008, long before projects such as Docker and Kubernetes were released. It is no surprise then, that over the years shortcomings in the design of cgroups were noticed, which led to the release of CGroupsV2 (unified cgroup hierarchy) with Linux 4.5. The most significant difference between CGroupsV1 and CGroupsV2 is that, whereas in v1 control groups applied to each resource separately, in v2 there is a single (unified) hierarchy of control groups which apply across all resources.

# Why?
This new structure addresses a number of shortcomings in the design of CGroupsV1:
* With multiple hierarchies, ensuring controls across multiple resources meant that changes had to be synchronized to different points in the hierarchy. This introduced synchronization timing windows which could lead to races. A single cgroup hierarchy means applications no longer have to keep multiple hierarchies in sync and can operate on cgroups in a race-free way.
* Previously, only immediate actions of processes could be tracked. This left page cache writeback and network traffic unaccounted for. These are now mapped to the correct cgroup. The block I/O controller in particular has seen lots of improvements.
* The tighter integration between cgroup controllers and kernel subsystems improves behavior in the face of resource shortages. Now actions such as reclaiming memory can happen before workloads are killed. This leads to improved resource utilization and helps with bursty workloads.
* It is now possible to safely delegate a cgroup subhierarchy to a non-root process, which enables rootless container runtimes to work.
* When CGroupsV1 was defined, BPF was a very limited technology and there was no integration considered between cgroup and BPF. Since then, it has evolved to “extended BPF” (eBPF) and is now a widespread technique for extending the kernel with custom functionality (much like JavaScript extended the Web browser). With CGroupsV2, eBPF programs can be attached directly to cgroups which allows for improvements in areas such as security, networking and tracing.

The upshot for users is that, with CGroupsV2, their systems will become **more reliable and secure**.

The Kinvolk team were early and enthusiastic supporters of CGroupsV2. The initial release of our Inspektor Gadget eBPF toolkit for Kubernetes, for example, depended on CGroupsV2 (which we shipped in a special “Edge” version of Flatcar) to attach its gadgets to specific containers in a cluster. However, it was clear that we could not adopt it as the default in the mainstream Flatcar Container Linux channels until the container ecosystem – including Kubernetes and the various container runtimes – fully supported it.

Fortunately, today CGroupsV2 is widely supported across the ecosystem (Docker 20.10, Kubernetes 1.19+, containerd 1.4+). Moreover, CGroupsV1 has been deprecated upstream and all new development happens on CGroupsV2. Therefore, it was clear to us that the time was right to bring CGroupsV2 into Flatcar Container Linux.

There remained just one question, however: how do we implement this change without disrupting existing deployed nodes?

# Migration
From our recent Community survey, we know that more than 80% of Flatcar users run Kubernetes (that’s what it was designed for after all). Unfortunately, we determined that Kubernetes doesn’t deal well with cgroup setting being changed on a deployed node, so we couldn’t simply switch the setting – with Flatcar’s widely-adopted automated update process, such a change would have been automatically deployed to thousands of nodes and broken a lot of already deployed clusters.

So we opted to keep things stable and predictable for existing users, as follows:
* Already deployed nodes will stay on CGroupsV1 and will allow users to opt-in to migrating to CGroupsV2 when they feel comfortable doing so.
* New nodes (those launched with a version higher or equal to v2969.0.0) will start with CGroupsV2 across all system components: Docker, containerd and systemd.

How do we achieve this? During the update process we make use of a [postinstall](https://github.com/kinvolk/update_engine/blob/flatcar-master/flatcar-postinst) hook that is part of our update payload to extend the kernel command line with the arguments: `systemd.unified_cgroup_hierarchy=0 systemd.legacy_systemd_cgroup_controller`.

We are also pinning the previous default containerd configuration across an update, which specifies use of cgroupfs driver for cgroup.

In making these decisions, we are following a principle of maximum caution: neither of these migration steps will be applied if users have customized any kernel command line settings related to cgroup or if they do not rely on the default configuration of containerd shipped in Flatcar. Our goal was to not disrupt any already provisioned Kubernetes cluster powered by Flatcar.

While we are confident that the migration will be well received, there may be edge cases that are still not ready for CGroupsV2. For example:
* The NVIDIA container runtime does not work with cgroupsv2 yet (but should soon https://github.com/NVIDIA/libnvidia-container/issues/111#issuecomment-760189427)
*	k3s works with CGroupsV2 but does not use the systemd cgroup driver
*	Some users may be on older Kubernetes versions (1.18 and older), which will not work with CGroupsV2.

For users hitting any of these cases, we have prepared a Container Linux Config snippet that allows nodes deployed after v2969.0.0 to remain on CGroupsV1, but still take advantage of the other improvements that shipped in that version (Docker 20.10!). Check it out here: https://kinvolk.io/docs/flatcar-container-linux/latest/container-runtimes/switching-to-unified-cgroups/#starting-new-nodes-with-legacy-cgroups. PXE based deployments can also use the same kernel command line parameters to decide whether to use the default CGroupsV2 or stay on CGroupsV1.

# Alpha and beyond
These changes are available in the Alpha channel today. The Alpha channel is less scary than it sounds, we develop the Alpha channel with just as much care as the Stable channel and it passes the same suite of tests across all supported hardware/cloud platforms as stable releases. We are eager to hear how the community receives the migration to CGroupsV2, so we encourage everyone to try Alpha today! Following our release cadence, we expect v2969 to be promoted to the Stable channel towards the end of October 2021.

Check out the full documentation of the changes here: https://kinvolk.io/docs/flatcar-container-linux/latest/container-runtimes/switching-to-unified-cgroups/. Should you encounter issues caused by the switch, feel free to reach out on the issue tracker https://github.com/kinvolk/Flatcar or our matrix channel https://app.element.io/#/room/#flatcar:matrix.org
