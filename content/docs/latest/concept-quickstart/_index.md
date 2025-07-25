---
title: Flatcar Concepts and Quick Start
Linktitle: Concepts and Getting Started 
weight: 1
---

Flatcar is a fully automated operating system focused on container workloads.
* It's immutable; individual OS components cannot be changed at run-time.
* It's minimal; only bits needed to comfortably run container workloads are included.
* It's automated; no interaction with live instances are required.

Contrary to general purpose (i.e. most) Linux distributions, Flatcar is configured before it is provisioned ("installed").

Check out our [quickstart guide](quickstart-guide) and the more thorough [tutorial](tutorial/) for hands-on with Flatcar.

Imagine provisioning Flatcar like deploying a Kubernetes application: K8s apps are deployed by applying a declarative configuration to a cluster.
Flatcar is provisioned by applying an Ignition config to a cloud environment, or to a fresh bare metal server.
Consequently, users are not meant to interact with nodes after provisioning (though they may, if they want).

In the Flatcar world, interacting with nodes after provisioning equals running `kubectl exec` to connect to a pod after starting it.
There may be reasons to do that, but it's not part of regular operations.

## Foundational Concepts

1. **Immutable and image-based**.
   * In contrast to general purpose Linux distributions, the OS cannot be modified.
     The OS partition is read-only and dm-verity protected. OS binaries cannot be changed.
     Updates _always_ update _all_ binaries of the base OS, including kernel and initrd.
   * There is no way to install applications to the Flatcar base OS; you get what's shipped in the OS image, that's it.
   * There is no package manager or package management; tools shipped with the OS image cannot be added / removed or individually updated.
     This prevents version drift: any given Flatcar release version corresponds to the complete version set of all tools and binaries shipped with the respective OS release.
2. **Minimal and optimised for container workloads**.
   * The OS ships the minimal set of tools necessary to run container workloads: docker and containerd.
   * Basic tools and utilities for setting up nodes (partitioning, crypto, volume management, networking tools etc.) are also included.
   * User-level services and applications must be run as container images.
3. **Fully automated**
   * Provisioning and operations are fully automated.
   * Nodes are configured via [declarative configuration](**FIXME: TODO**) that is passed to node provisioning.
     The configuration is applied **once**, at first boot, preventing configuration drift.
   * Users are not expected to interact with Flatcar instances in order to configure the OS or foundational services.
     All configuration should happen at provisioning time.
4. **Thoroughly tested and self-updating**
   * We never break user workloads, ever. We guarantee even major distribution upgrades are seamless and frictionless, customer workloads will continue to run.
   * Flatcar releases, nightlies, and even pull requests to the OS repository are thoroughly and rigorously tested. Our automated test suite covers well over 100 scenario tests.
   * Flatcar supports atomic in-place updates of the OS, with flexibly customisable scheduling / signaling of node refreshes (reboots).
   * Flatcar also supports atomic, fully automatable roll-backs in case of issues.
5. **Community stewarded, not vendor driven**
   * Flatcar is a CloudNative Computing Foundation incubating project. As such, the CNCF is the project's steward and owner of the Flatcar brand.
   * Flatcar maintainers and contributors come from a variety of backgrounds and work for different companies.
