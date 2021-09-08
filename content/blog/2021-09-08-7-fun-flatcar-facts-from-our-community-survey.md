+++
authors = ["andrew-randall"]
date = "2021-09-08T10:00:00+02:00"
description = "7 Fun Flatcar Facts from our Community Survey "
draft = false
tags = ["flatcar", "community"]
title = "7 Fun Flatcar Facts from our Community Survey "
postImage = "/splash/many-trains.jpg"
+++

We recently asked the Flatcar user community to share their experiences deploying Flatcar Container Linux. We promised to share the results back with the community, and so here are the top 7 take-aways from the survey:

## #1 Kubernetes is deployed on more than 4 out of 5 Flatcar deployments

No surprise here, since Flatcar is designed for containers and Kubernetes is the most popular container orchestration system, 82% of Flatcar users reported that they ran Kubernetes.

Interestingly, more than half (57%) of Flatcar users report that they run unorchestrated Docker containers.

{{< figure src="/media/community-survey-2021/image1.png" alt="Chart showing the percentage of users deploying Flatcar under a certain environment. Kubernetes: 82.1%; Docker containers: 57.1%; Non-containerized apps: 3.6%; NFS Server: 3.6%; Mesos / DC/ OS, and others: 0%" >}}

## #2 Kubeadm is the most popular Kubernetes deployment tool, among a wide variety of installers and distros

We asked those users who are deploying Kubernetes which distro or installation tool they were using. Even among a relatively small sample size, there was a wide variety of solutions in use, indicating that the Kubernetes landscape is still very heterogeneous. The most widely used tool, however, was kubeadm, reflecting that project’s position as the canonical upstream “best practice” installer.

{{< figure src="/media/community-survey-2021/image2.png" alt="Chart showing distros / installers used for installing Flatcar. kubeadm: 7; DIY: 4; Lokomotive, Amazon EKS, kops, Rancher, Typhoon: 2; Cluster API, K3s, Gardener, Kubermatic: 1" >}}

## #3 Three quarters of Flatcar users deploy in their own data centers, but more than half of those users also deploy Flatcar in the cloud

Users deploy Flatcar in a wide variety of environments: including all the major clouds, on-premises with vSphere, on-premises bare metal, and more. Looking at just cloud vs on-prem, we see that hybrid is the most popular option with users deploying some workloads on-prem and some in cloud.

{{< figure src="/media/community-survey-2021/image3.png" alt="Chart showing percentage of Flatcar deployments. On-prem: 36%; Cloud only: 25%; Hybrid: 39%" >}}

## #4 Most Flatcar users automate updates

Flatcar was designed to be an auto-updating operating system, inheriting the A/B partition and automatic update downloading mechanism from ChromeOS. More than 6 out of 10 users make use of this automatic update mechanism to ensure their systems stay always up to date. The remaining 37% reinstall nodes as required when new builds are available.

{{< figure src="/media/community-survey-2021/image4.png" alt="Chart showing how users update Flatcar. Reinstalling nodes: 37%; Kinvolk Update Service: 11.1%; Self-deployed Nebraska server: 3.8%; Public update server: 48.1%" >}}

## #5 Nine out of every ten users cite Security and Manageability as key reasons for deploying Flatcar

Flatcar’s combination of automatic updates with an immutable base OS image are designed to make large distributed systems both more secure and easier to manage. This is reflected in the fact that 93% of users rated security and manageability as “somewhat” or “very” important factors in their decision to deploy Flatcar.

{{< figure src="/media/community-survey-2021/image5.png" alt="Chart showing reasons why users deploy Flatcar. Security: 93%; Manageability (minimal management overhead): 93%; Small, lightweight distro: 86%; Integration with container ecosystem: 82%; Open, community-driven development process: 82%; Simple, atomic update mechanism: 79%" >}}

If we drill into the responses and look at the weighted ranking (from 1 = not at all important to 5 = very important), we see Flatcar’s security and manageability characteristics, along with its small, lightweight footprint, are still the most decisive factors for users:

{{< figure src="/media/community-survey-2021/image6.png" alt="" >}}

## #6 Only half of all Flatcar users adopted it as a drop-in CoreOS replacement

Flatcar started as a fork of CoreOS Container Linux, enabling users to seamlessly transition from CoreOS to Flatcar. While this was a significant driver for Flatcar’s initial success, it was a factor for only half of active users today.

In other words, fully half of the users selected Flatcar as the best container operating system for their needs, independent of its CoreOS compatibility.

{{< figure src="/media/community-survey-2021/image7.png" alt="" >}}

## #7 Flatcar users don’t just like Flatcar, they love it

We asked our users how likely it is that they would recommend Flatcar to a friend or colleague on a scale of 0-10 (the classic “NPS question”). Fully 71% rated Flatcar as 9 or 10, and none was below 7, resulting in an excellent NPS Score of 71.

{{< figure src="/media/community-survey-2021/image8.png" alt="" >}}

Some sample comments:

* Kinvolk taking over CoreOS and turning it into Flatcar is the best thing that could have happened to CoreOS. It's better maintained, documented and supported than it was before, and it continues to develop in a good direction. Great work, guys!​
* My team loves all of you.
* Very stable and reliable container operating system
* It just works and does not require any attention from us
* I've been very happy with it. I moved when CoreOS stopped being maintained and it's served me well since.​
* Having been a big user of coreOS, the continuity of the technology is a big :thumbsup: from me.​
* A well-maintained, professional and innovative product that meets a real need without being too radical​
* Better than the alternatives​
* Cool product and easy to manage​
* I think it's the best thing since /proc​
* It's an amazing evolution of CoreOS Container Linux, keeping all the good parts and adding more of them on top.​
* Very good project, I hope it stays! I am thinking about taking it from personal use to business use.​
* It's flat and runs my containers without issue, thus far I haven't had any problems I didn't create myself.​
* It's a perfect base for container-based workloads: lightweight, flexible, secure, easy to understand and use​
* For most applications I encounter, a specialized container OS is a far better solution than a traditional OS. As a matter of fact I have already convinced several peers to trial flatcar in their environments.​
* We believe that flatcar delivers on all of its promises.​

## Some Notes

The survey received 28 responses, so the law of small numbers applies. We believe the results reasonably reflect the overall trends in Flatcar deployments, but of course it is a relatively small sample size compared with the hundreds that would be required to get to a high level of confidence around the percentages.

Of the 28 respondents, three quarters (75%) are deploying Flatcar in production, while 61% are deploying for dev/test workloads. Deployment sizes range from less than 10 to more than 1,000.

{{< figure src="/media/community-survey-2021/image9.png" alt="" >}}
{{< figure src="/media/community-survey-2021/image10.png" alt="" >}}
