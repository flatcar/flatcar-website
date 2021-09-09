+++
title = "VMware and Kinvolk bring Flatcar Container Linux to vSphere, providing supported path forward for CoreOS users"
tags = ["coreos", "Linux", "flatcar", "vmware", "vsphere"]
topics = ["Flatcar Container Linux", "Product"]
authors = ["Andy Randall"]
description = "VMware and Kinvolk bring Flatcar Container Linux to vSphere, providing supported path forward for CoreOS users"
draft = false
date = "2020-04-21T12:30:00+02:00"
postImage = "flatcar-vmware.png"
+++

Recently, we have been working with many end users who, faced with the imminent
end-of-life of CoreOS Container Linux, are migrating to Flatcar Container Linux
as the secure foundation for their container deployments. And, with the
majority of enterprises adopting vSphere for their private clouds[^1], we have
heard from many of those users that fully certified support for vSphere is an
important consideration in their migration decision.

Today, we are pleased to share details of our collaboration with VMware to
enable the deployment of Flatcar Container Linux in a fully-supported vSphere
environment. There are a number of important elements to this:

* Most prominently, Flatcar Container Linux is now [listed in the vSphere
  Compatibility
  Guide](https://www.vmware.com/resources/compatibility/search.php?deviceCategory=software&details=1&partner=1079&productNames=15&page=1&display_interval=10&sortColumn=Partner&sortOrder=Asc&testConfig=16)
  as “Supported”, meaning that VMware is committed to providing full support to
  its customers who choose to deploy Flatcar.

* Flatcar Container Linux now ships with a vSphere-optimized build, including
  Open VM Tools, and testing on vSphere is integrated into our continuous
  integration suite, meaning every new release is validated by Kinvolk on
  vSphere.

* Our engineering teams continue to collaborate on multiple initiatives to
  further enhance the end-user experience of Flatcar Container Linux as a guest
  OS in vSphere, and as a foundation for Kubernetes in VMware environments.

* Kinvolk and VMware’s support teams have set up joined-up processes for
  collaboratively supporting our joint end user customers.

As a result of this collaboration, VMware is [recommending](http://blogs.vmware.com/vsphere/2020/04/announcing-support-for-flatcar-linux-on-vsphere) that current CoreOS Container Linux users migrate to Flatcar Container Linux as quickly as
possible, and by May 26 (the date when Red Hat will no longer provide
maintenance and security updates) at the latest.

To find out how to run Flatcar Container Linux as your guest OS in vSphere,
please see the documentation on [running Flatcar in VMware](https://docs.flatcar-linux.org/os/booting-on-vmware/)
and on how to [update a VM from CoreOS](https://docs.flatcar-linux.org/os/update-from-container-linux/) to Flatcar Container Linux.

If you have decided to adopt Flatcar Container Linux as the foundation for your
container environment, and want to have the peace-of-mind of enterprise support
with a service level agreement (including 24x7 and joined-up support between
Kinvolk and VMware), please email [hello@kinvolk.io](mailto:hello@kinvolk.io)
to discuss a Flatcar Container Linux Subscription.

[^1]: RightScale 2019 State of the Cloud Report, by Flexera
