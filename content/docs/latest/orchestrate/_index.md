---
title: Orchestration & Container Runtimes
weight: 60
description: >
  Manage clusters, Kubernetes, and container runtimes on Flatcar Container Linux.
---

# Flatcar Orchestration & Container Runtimes

Source section: `orchestrate/` (renamed from `container-runtimes/` + parts of `setup/clusters/` in the refactored branch). Covers Docker, Kubernetes, and cluster configuration.

## Containers

Docker and containerd ship as built-in sysext images enabled by default since Flatcar 3794.0.0.

### Docker customization with daemon.json

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /etc/docker/daemon.json
      contents:
        inline: |
          {
            "log-driver": "journald",
            "storage-driver": "overlay2"
          }
```

### Custom Docker/containerd version

Disable the built-in sysexts (see flatcar-provisioning) and place custom binaries from `sysext-bakery` or `/opt/bin/`.

### Registry authentication

Credentials in `~/.docker/config.json` or `/etc/docker/config.json` for system-wide access.

### Switching to unified cgroups:

Covered in `orchestrate/containers/switching-to-unified-cgroups.md` — relevant for Kubernetes nodes.

Incus (LXC/VM manager):** Opt-in sysext (`incus`) since Flatcar 4285.0.0. See `orchestrate/containers/incus.md`.

## Kubernetes

Flatcar is a first-class Kubernetes node OS. Kubernetes is not bundled but deploys cleanly via kubeadm + sysext images from `sysext-bakery`.

### Compatibility - as of 2026

| Kubernetes | Alpha | Beta | Stable | LTS (2024) |
|---|---|---|---|---|
| 1.31–1.33 | Known working | Known working | Known working | Known working |
| 1.34–1.36 | Tested | Tested | Tested | Tested |

Tested CNIs: **Cilium**, **Flannel**, **Calico**

Known issue: Flannel >0.17.0 incompatible with enforced SELinux.

### kubeadm + sysext (recommended)

Use the Kubernetes sysext from `sysext-bakery` with `systemd-sysupdate` for in-place Kubernetes version upgrades.

### Butane snippet (control plane):

```yaml
variant: flatcar
version: 1.0.0
storage:
  links:
    - target: /opt/extensions/kubernetes/kubernetes-v1.33.2-x86-64.raw
      path: /etc/extensions/kubernetes.raw
  files:
    - path: /etc/sysupdate.kubernetes.d/kubernetes-v1.33.conf
      contents:
        source: https://extensions.flatcar.org/extensions/kubernetes/kubernetes-v1.33.conf
    - path: /opt/extensions/kubernetes/kubernetes-v1.33.2-x86-64.raw
      contents:
        source: https://extensions.flatcar.org/extensions/kubernetes-v1.33.2-x86-64.raw
    - path: /etc/hostname
      contents:
        inline: "flatcar-node1"
```

### Reboot coordination

Use [FLUO](https://github.com/flatcar/flatcar-linux-update-operator/) (preferred) or [Kured](https://kured.dev/) instead of locksmithd for Kubernetes nodes.

### High Availability Kubernetes

- External load balancer for the API server
- etcd: stacked (on control plane nodes) or external
- FLUO drains and reboots nodes safely during OS updates

## Clusters

| Topic | Notes |
|---|---|
| Cluster architectures | Single-master, multi-master HA, worker-only roles |
| Discovery | etcd-based cluster discovery via a discovery URL |
| ECS | Flatcar nodes can register with Amazon ECS |

