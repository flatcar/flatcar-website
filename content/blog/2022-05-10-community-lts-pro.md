+++
tags = ["flatcar", "LTS", "GPU"]
topics = ["Linux", "LTS", "GPU"]
authors = ["thilo-fromm", "andrew-randall", "kai-lueke"]
title = "Flatcar Container Linux Long-Term Support (LTS) channel and advanced features now available to community."
draft = false
description = "Flatcar Container Linux community images now include a Long-Term Support (LTS) channel, along with support for Azure GPU instances, EKS workers, and FIPS mode"
date = "2022-05-10T14:00:00+02:00"
postImage = "/flatcar-linux-public-release.png"
+++

We are pleased to announce some significant enhancements to Flatcar Container Linux community images, with a Long-Term Support (LTS) channel and some advanced features that were previously only available to Kinvolk subscription customers.

Flatcar Container Linux LTS is a family of release channels dedicated to users who want a slower-moving update cadence, for example because they are running workloads with an elevated infrastructure maintenance cost.
Each Flatcar LTS release is based on an LTS upstream kernel and kept up to date with critical patch fixes including for security vulnerabilities but will not receive new Flatcar features or major package or component version updates, ensuring maximum stability for applications while simplifying operations and maintaining security compliance.

The specific details of how LTS releases are managed is as follows:
- A new major LTS is released roughly once every 12-15 months, so operators will never need to perform a major version upgrade more than once a year.
  This compares with a typical two-month refresh cadence for Flatcar Stable, and even more frequent Alpha and Beta updates.
- Each major LTS release enjoys an 18 months maintenance period, so there is a 3-6 month transition window during which time operators can switch to the latest LTS channel.
  See the [docs](https://flatcar-linux.org/docs/latest/setup/releases/switching-channels/#freezing-an-lts-stream) for more details of how to control LTS upgrades.
- LTS receives accumulated patch releases roughly once a month until the next major LTS release is available, after which point critical bug fixes and security patches are released on an as-needed basis until the end of the transition window.
- New LTS releases are always branched off a “golden” stable release, i.e. have passed our regular alpha-beta-stable maturity process and spent additional soak time in the stable channel.

We have been publishing LTS sources since 2020, but install images and updates were previously only available to subscription customers.
Starting with the [LTS-2022 (3033.3.0)](https://www.flatcar.org/releases/#release-3033.3.0) release, images and update channels will be available to the community for free alongside other channels (alpha, beta, stable).

In addition to LTS, we are also now shipping some new advanced features in community images:
- Built-in drivers for Azure GPU-enabled instances, enabling access to accelerated graphics hardware for workloads such as machine learning.
- Out-of-the-box support for Elastic Kubernetes Service (EKS).
  This massively simplifies the creation of Flatcar-based EKS worker nodes as the AWS specific Flatcar image now includes scripts that deploy the EKS runtime at deploy time.
  See our [earlier blog post](https://kinvolk.io/blog/2021/02/deploying-an-eks-cluster-with-flatcar-workers/) for details of how to use this feature.
- Support for Federal Information Processing Standards (FIPS mode), potentially enabling compliance with federal encryption requirements, depending on corequisite support in deployed user space packages.

These features were previously only included in the (paid) “Pro” images in cloud marketplaces, and are now available to the community for free in all release channels (including LTS-2022).
We are excited at this significant expansion of the deployment options and capabilities available to the Flatcar user community.
To try Flatcar out, please check out our [Getting Started guide](https://www.flatcar.org/docs/latest/installing/).
If you’d like to get involved in the project, why not join our next monthly [Community Meeting](https://github.com/flatcar-linux/Flatcar/#monthly-community-meeting-and-release-planning)?
