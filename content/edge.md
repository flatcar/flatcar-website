---
title: Flatcar Linux Edge
description: List of changes in the Edge channel
author: Alban Crequy
date: 2019-04-11T10:00:00+01:00
draft: false
---

## What is the Edge channel?

Edge is a new channel for Flatcar Linux.

It’s completely unstable. All features should be assumed alpha or pre-alpha quality. Features will be added and removed at will.

It is maintainer supported. It means that if someone wants something in, they need to maintain it. If unmaintained, it’s out.

Is a part of our larger K8s distro plans. It aims to be a testbed for cutting-edge Linux & K8s developments 

## Demo

### bcck8s

FIXME: instructions how to reproduce the bcck8s demo from Flatcar Linux Edge.

## Changes in the latest Edge release (2051.99.2)

### cgroup-v2 enabled

#### Goal

This allows us to filter BPF events by container.

#### Implementation

The following kernel parameters are added:
```
systemd.unified_cgroup_hierarchy=false
systemd.legacy_systemd_cgroup_controller=false
```

This was done on the following images:
- AWS. PR: FIXME
- bare-metal. PR: FIXME

The following Docker options were added:
```
--exec-opt native.cgroupdriver=systemd
```

This was done in PR FIXME.

containerd's configuration was updated to have the following in `/run/torcx/unpack/docker/usr/share/containerd/config.toml`:
```
disabled_plugins = []
...
[plugins.cri]
systemd_cgroup = true
```

This was done in PR FIXME.

The Kubelet will need to have `--cgroup-driver=systemd`. Kubelet is not part of Flatcar Linux. TODO: Instructions for this will follow.

### Additional tooling in torcx

Installing bpftool, cgroupid, kubectl: FIXME:

```
sudo mkdir -p /opt/bin

docker run --privileged -v /tmp:/out albanc/bcck8s cp /bin/bpftool /out/
sudo cp /tmp/bpftool /opt/bin/

docker run --privileged -v /tmp:/out albanc/cgroupid cp /bin/cgroupid /out/
sudo cp /tmp/cgroupid /opt/bin/

cd /opt/bin/
curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
chmod +x kubectl
```

## Future changes

