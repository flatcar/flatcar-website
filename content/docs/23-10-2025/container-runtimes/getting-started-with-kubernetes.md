---
title: Getting started with Kubernetes
description: Operate Kubernetes from Flatcar
aliases:
    - ../os/switching-from-docker-to-containerd-for-kubernetes
    - ./switching-from-docker-to-containerd-for-kubernetes
weight: 11
---

One of the Flatcar purposes is to run container workloads, this term is quite generic: it goes from running a single Docker container to operate a Kubernetes cluster.

This documentation will cover preliminary aspects of operating Kubernetes cluster based on Flatcar.

# Supported Kubernetes version

A Kubernetes basic scenario (deploy a simple Nginx) is being tested on Flatcar accross the channels and various CNIs, it mainly ensures that Kubernetes can be correctly installed and can operate in a simple way.

One way to contribute to Flatcar would be to extend the covered CNIs (example: [kubenet][kubenet]) or to provide more complex scenarios (example: [cilium extension][cilium]).

This is a compatibility matrix between Flatcar and Kubernetes deployed using vanilla components and Flatcar provided software:
| :arrow_down: Flatcar channel \ Kubernetes Version :arrow_right: | 1.29               | 1.30               | 1.31               | 1.32 | 1.33 | 1.34 |
|--------------------------------------|--------------------|--------------------|--------------------|---------------------------------|------|------|
| Alpha                                | :large_orange_diamond: | :large_orange_diamond: |:large_orange_diamond: |:white_check_mark: |:white_check_mark: |:white_check_mark: |
| Beta                                 | :large_orange_diamond: | :large_orange_diamond: |:large_orange_diamond: |:white_check_mark: |:white_check_mark: |:white_check_mark: |
| Stable                               | :large_orange_diamond: | :large_orange_diamond: |:large_orange_diamond: |:white_check_mark: |:white_check_mark: |:white_check_mark: |
| LTS (2024)                           | :large_orange_diamond: | :large_orange_diamond: |:large_orange_diamond: |:white_check_mark: |:white_check_mark: |:white_check_mark: |

:large_orange_diamond:: The version is not tested anymore before a release but was known for working.

Tested CNIs:
- Cilium
- Flannel
- Calico

_Known issues_:
* Flannel > 0.17.0 does not work with enforced SELinux ([flatcar#779][flatcar-779])

# Deploy a Kubernetes cluster with Flatcar

## Using Kubeadm

`kubeadm` remains one standard way to quickly deploy and operate a Kubernetes cluster. It's possible to install the tools (`kubeadm`, `kubelet`, etc.) using Ignition or directly with the Kubernetes sysext image distributed from the [flatcar/sysext-bakery][sysext-bakery] release page.

### Setup the control plane

Here are two examples to setup a control plane with [Butane][butane]. The first example is using the systemd-sysext approach to bring in the binaries and update them through systemd-sysupdate. The second approach fetches the binaries but has no way of updating them in-place.

<div>
  <ul class="nav nav-tabs">
    <li class="active"><a href="#sysext" class="active" data-toggle="tab">With systemd-sysext and updates</a></li>
    <li><a href="#no-sysext" data-toggle="tab">With plain binaries and no updates</a></li>
  </ul>
  <div class="tab-content coreos-docs-image-table">
    <div class="tab-pane active" id="sysext">
      <div class="channel-info">
        This is an example using systemd-sysext and systemd-sysupdate. NOTE: We are using <a href="https://kured.dev/docs/">Kured</a> to coordinate nodes reboot when there is a new Kubernetes sysext image available (or if Flatcar has been updated), hence the /run/reboot-required file.
        **Note:** In these examples, the hostname is manually set via initial provisioning (`/etc/hostname`).
        In cloud environments, the hostname can be set dynamically from metadata exposed at `/run/metadata/flatcar`
        <pre>
---
version: 1.0.0
variant: flatcar
storage:
  links:
    - target: /opt/extensions/kubernetes/kubernetes-v1.33.2-x86-64.raw
      path: /etc/extensions/kubernetes.raw
      hard: false
  files:
    - path: /etc/sysupdate.kubernetes.d/kubernetes-v1.33.conf
      contents:
        source: https://extensions.flatcar.org/extensions/kubernetes/kubernetes-v1.33.conf
    - path: /etc/sysupdate.d/noop.conf
      contents:
        source: https://extensions.flatcar.org/extensions/noop.conf
    - path: /opt/extensions/kubernetes/kubernetes-v1.33.2-x86-64.raw
      contents:
        source: https://extensions.flatcar.org/extensions/kubernetes-v1.33.2-x86-64.raw
    - path: /etc/hostname
      contents:
        inline: "flatcar-node1"
systemd:
  units:
    - name: systemd-sysupdate.timer
      enabled: true
    - name: systemd-sysupdate.service
      dropins:
        - name: kubernetes.conf
          contents: |
            [Service]
            ExecStartPre=/usr/bin/sh -c "readlink --canonicalize /etc/extensions/kubernetes.raw > /tmp/kubernetes"
            ExecStartPre=/usr/lib/systemd/systemd-sysupdate -C kubernetes update
            ExecStartPost=/usr/bin/sh -c "readlink --canonicalize /etc/extensions/kubernetes.raw > /tmp/kubernetes-new"
            ExecStartPost=/usr/bin/sh -c "if ! cmp --silent /tmp/kubernetes /tmp/kubernetes-new; then touch /run/reboot-required; fi"
    - name: locksmithd.service
      # NOTE: To coordinate the node reboot in this context, we recommend to use Kured.
      mask: true
    - name: kubeadm.service
      enabled: true
      contents: |
        [Unit]
        Description=Kubeadm service
        Requires=containerd.service
        After=containerd.service
        After=network-online.target
        ConditionPathExists=!/etc/kubernetes/kubelet.conf
        [Service]
        ExecStartPre=/usr/bin/kubeadm init
        ExecStartPre=/usr/bin/mkdir /home/core/.kube
        ExecStartPre=/usr/bin/cp /etc/kubernetes/admin.conf /home/core/.kube/config
        ExecStart=/usr/bin/chown -R core:core /home/core/.kube
        [Install]
        WantedBy=multi-user.target
        </pre>
      </div>
    </div>
    <div class="tab-pane" id="no-sysext">
      <div class="channel-info">
        :warning: To ease the reading, we voluntarily omitted the checksums of the downloaded artifacts.
        <pre>
---
version: 1.0.0
variant: flatcar
storage:
  files:
    - path: /opt/bin/kubectl
      mode: 0755
      contents:
        source: https://dl.k8s.io/v1.33.2/bin/linux/amd64/kubectl
    - path: /opt/bin/kubeadm
      mode: 0755
      contents:
        source: https://dl.k8s.io/v1.33.2/bin/linux/amd64/kubeadm
    - path: /opt/bin/kubelet
      mode: 0755
      contents:
        source: https://dl.k8s.io/v1.33.2/bin/linux/amd64/kubelet
    - path: /etc/systemd/system/kubelet.service
      contents:
        source: https://raw.githubusercontent.com/kubernetes/release/refs/tags/v0.18.0/cmd/krel/templates/latest/kubelet/kubelet.service
    - path: /etc/systemd/system/kubelet.service.d/10-kubeadm.conf
      contents:
        source: https://raw.githubusercontent.com/kubernetes/release/refs/tags/v0.18.0/cmd/krel/templates/latest/kubeadm/10-kubeadm.conf
    - path: /etc/kubeadm.yml
      contents:
        inline: |
          apiVersion: kubeadm.k8s.io/v1beta3
          kind: InitConfiguration
          nodeRegistration:
            kubeletExtraArgs:
              volume-plugin-dir: "/opt/libexec/kubernetes/kubelet-plugins/volume/exec/"
          ---
          apiVersion: kubeadm.k8s.io/v1beta3
          kind: ClusterConfiguration
          controllerManager:
            extraArgs:
              flex-volume-plugin-dir: "/opt/libexec/kubernetes/kubelet-plugins/volume/exec/"
    - path: /etc/hostname
      contents:
        inline: "flatcar-node1"
systemd:
  units:
    - name: kubelet.service
      enabled: true
      dropins:
        - name: 20-kubelet.conf
          contents: |
            [Service]
            ExecStart=
            ExecStart=/opt/bin/kubelet $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS $KUBELET_KUBEADM_ARGS $KUBELET_EXTRA_ARGS
    - name: kubeadm.service
      enabled: true
      contents: |
        [Unit]
        Description=Kubeadm service
        Requires=containerd.service
        After=containerd.service
        After=network-online.target
        ConditionPathExists=!/etc/kubernetes/kubelet.conf
        [Service]
        Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/opt/bin"
        ExecStartPre=/opt/bin/kubeadm config images pull
        ExecStartPre=/opt/bin/kubeadm init --config /etc/kubeadm.yml
        ExecStartPre=/usr/bin/mkdir /home/core/.kube
        ExecStartPre=/usr/bin/cp /etc/kubernetes/admin.conf /home/core/.kube/config
        ExecStart=/usr/bin/chown -R core:core /home/core/.kube
        [Install]
        WantedBy=multi-user.target
        </pre>
      </div>
    </div>
  </div>
</div>


This minimal configuration can be used with Flatcar on QEMU (:warning: be sure that the instance has enough memory: 4096mb is good).

```bash
butane < config.yaml > config.json
./flatcar_production_qemu.sh -i config.json -- -display curses
kubectl get nodes
NAME            STATUS     ROLES           AGE     VERSION
flatcar-node1   NotReady   control-plane   2m10s   v1.33.2
```

The control plane will appear has non-ready until a CNI is deployed, here's an example with calico:
```bash
kubectl \
  apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.24.1/manifests/calico.yaml
kubectl get nodes
NAME            STATUS   ROLES           AGE     VERSION
flatcar-node1   Ready    control-plane   5m30s   v1.33.2
```

If you want to coordinate the nodes reboot when there is a new Kubernetes sysext image or a Flatcar update, you can deploy [`Kured`][kured]:
```bash
latest=$(curl -s https://api.github.com/repos/kubereboot/kured/releases | jq -r '.[0].tag_name')
kubectl apply -f "https://github.com/kubereboot/kured/releases/download/$latest/kured-$latest-dockerhub.yaml"
```

We can now prepare the nodes to join the cluster.

### Setup the nodes

Here's are two examples for a [butane][butane] configuration to setup the nodes. The first example is using the systemd-sysext approach to bring in the binaries and update them through systemd-sysupdate. The second approach fetches the binaries but has no way of updating them in-place.

<div>
  <ul class="nav nav-tabs">
    <li class="active"><a class="active" href="#sysext-nodes" data-toggle="tab">With systemd-sysext and updates</a></li>
    <li><a href="#no-sysext-nodes" data-toggle="tab">With plain binaries and no updates</a></li>
  </ul>
  <div class="tab-content coreos-docs-image-table">
    <div class="tab-pane active" id="sysext-nodes">
      <div class="channel-info">
        This is an example using systemd-sysext and systemd-sysupdate. NOTE: We are using <a href="https://kured.dev/docs/">Kured</a> to coordinate nodes reboot when there is a new Kubernetes sysext image available (or if Flatcar has been updated), hence the /run/reboot-required file.
        <pre>
---
version: 1.0.0
variant: flatcar
storage:
  links:
    - target: /opt/extensions/kubernetes/kubernetes-v1.33.2-x86-64.raw
      path: /etc/extensions/kubernetes.raw
      hard: false
  files:
    - path: /etc/sysupdate.kubernetes.d/kubernetes-v1.33.conf
      contents:
        source: https://extensions.flatcar.org/extensions/kubernetes/kubernetes-v1.33.conf
    - path: /etc/sysupdate.d/noop.conf
      contents:
        source: https://extensions.flatcar.org/extensions/noop.conf
    - path: /opt/extensions/kubernetes/kubernetes-v1.33.2-x86-64.raw
      contents:
        source: https://extensions.flatcar.org/extensions/kubernetes-v1.33.2-x86-64.raw
    - path: /etc/hostname
      contents:
        inline: "flatcar-node2"
systemd:
  units:
    - name: systemd-sysupdate.timer
      enabled: true
    - name: systemd-sysupdate.service
      dropins:
        - name: kubernetes.conf
          contents: |
            [Service]
            ExecStartPre=/usr/bin/sh -c "readlink --canonicalize /etc/extensions/kubernetes.raw > /tmp/kubernetes"
            ExecStartPre=/usr/lib/systemd/systemd-sysupdate -C kubernetes update
            ExecStartPost=/usr/bin/sh -c "readlink --canonicalize /etc/extensions/kubernetes.raw > /tmp/kubernetes-new"
            ExecStartPost=/usr/bin/sh -c "if ! cmp --silent /tmp/kubernetes /tmp/kubernetes-new; then touch /run/reboot-required; fi"
    - name: locksmithd.service
      # NOTE: To coordinate the node reboot in this context, we recommend to use Kured.
      mask: true
    - name: kubeadm.service
      enabled: true
      contents: |
        [Unit]
        Description=Kubeadm service
        Requires=containerd.service
        After=containerd.service
        After=network-online.target
        ConditionPathExists=!/etc/kubernetes/kubelet.conf
        [Service]
        ExecStart=/usr/bin/kubeadm join $(output from 'kubeadm token create --print-join-command')
        [Install]
        WantedBy=multi-user.target
        </pre>
      </div>
    </div>
    <div class="tab-pane" id="no-sysext-nodes">
      <div class="channel-info">
        :warning: To ease the reading, we voluntarily omitted the checksums of the downloaded artifacts.
        <pre>
---
version: 1.0.0
variant: flatcar
storage:
  files:
    - path: /opt/bin/kubeadm
      mode: 0755
      contents:
        source: https://dl.k8s.io/v1.33.2/bin/linux/amd64/kubeadm
    - path: /opt/bin/kubelet
      mode: 0755
      contents:
        source: https://dl.k8s.io/v1.33.2/bin/linux/amd64/kubelet
    - path: /etc/systemd/system/kubelet.service
      contents:
        source: https://raw.githubusercontent.com/kubernetes/release/refs/tags/v0.18.0/cmd/krel/templates/latest/kubelet/kubelet.service
    - path: /etc/systemd/system/kubelet.service.d/10-kubeadm.conf
      contents:
        source: https://raw.githubusercontent.com/kubernetes/release/refs/tags/v0.18.0/cmd/krel/templates/latest/kubeadm/10-kubeadm.conf
    - path: /etc/hostname
      contents:
        inline: "flatcar-node2"
systemd:
  units:
    - name: kubelet.service
      enabled: true
      dropins:
        - name: 20-kubelet.conf
          contents: |
            [Service]
            ExecStart=
            ExecStart=/opt/bin/kubelet $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS $KUBELET_KUBEADM_ARGS $KUBELET_EXTRA_ARGS
    - name: kubeadm.service
      enabled: true
      contents: |
        [Unit]
        Description=Kubeadm service
        Requires=containerd.service
        After=containerd.service
        After=network-online.target
        ConditionPathExists=!/etc/kubernetes/kubelet.conf
        [Service]
        Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/opt/bin"
        ExecStart=/opt/bin/kubeadm join $(output from 'kubeadm token create --print-join-command')
        [Install]
        WantedBy=multi-user.target
        </pre>
      </div>
    </div>
  </div>
</div>

This method is far from being ideal in terms of infrastructure as code as it requires a two steps manipulation: create the control plane to generate the join configuration then pass that configuration to the nodes. Other solutions exist to make things easier, like Cluster API or [Typhoon][typhoon].

### Switching from Docker to containerd for Kubernetes

In Kubernetes v1.20, `dockershim` was deprecated and it has been [officially](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.24.md#dockershim-removed-from-kubelet) removed in Kubernetes v1.24.

The `containerd` CRI plugin is enabled by default and you can use containerd for Kubernetes while still allowing Docker to function.
Recent Kubernetes versions will prefer containerd over Docker automatically on recent Flatcar versions.

If you run `kubelet` in a Docker container, make sure it has access
to the following directories on the host file system:
- `/run/docker/libcontainerd/`
- `/run/containerd/`
- `/var/lib/containerd/`

And that it has access to the following binaries on the host file system and that they are included in `PATH`:
- For Flatcar releases until major version 3760:
  - `/run/torcx/unpack/docker/bin/containerd-shim-runc-v1`
  - `/run/torcx/unpack/docker/bin/containerd-shim-runc-v2`
- For Flatcar releases above major version 3760:
  - `/usr/bin/containerd-shim-runc-v1`
  - `/usr/bin/containerd-shim-runc-v2`

Finally, tell `kubelet` to use containerd by adding to it the following flags:
- `--container-runtime=remote`
- `--container-runtime-endpoint=unix:///run/containerd/containerd.sock`

## Cluster API

From the official [documentation][capi-documentation]:
> Cluster API is a Kubernetes sub-project focused on providing declarative APIs and tooling to simplify provisioning, upgrading, and operating multiple Kubernetes clusters.

As it requires to have some tools already installed on the OS to work correcly with CAPI, Flatcar images can be built using the [image-builder][image-builder] project.

While CAPI is an evolving project and Flatcar support is in-progress regarding the various providers, here's the current list of supported providers:
* [AWS][capi-aws]
* [Akamai / Linode][capi-linode]
* [Azure][capi-azure]
* [Kubevirt][capi-kubevirt]
* [OpenStack][openstack]
* [Proxmox][capi-proxmox]
* [vSphere][capi-vsphere]

## Kubespray

Kubespray is an open-source project used to deploy production ready Kubernetes cluster, learn more about it on the [documentation][kubespray-documentation].

Based on users feedback, Flatcar is known to work with Kubespray - you can read more about it in this section: <https://kubespray.io/#/docs/operating_systems/flatcar>.

[butane]: https://coreos.github.io/butane/
[capi-documentation]: https://cluster-api.sigs.k8s.io/
[capi-aws]: https://cluster-api-aws.sigs.k8s.io/
[capi-azure]: https://capz.sigs.k8s.io/
[capi-kubevirt]: https://github.com/kubernetes-sigs/cluster-api-provider-kubevirt
[capi-linode]: https://linode.github.io/cluster-api-provider-linode/topics/flavors/flatcar.html
[capi-proxmox]: https://github.com/ionos-cloud/cluster-api-provider-proxmox
[capi-vsphere]: https://github.com/kubernetes-sigs/cluster-api-provider-vsphere/blob/main/docs/ignition.md
[cilium]: https://github.com/flatcar/mantle/pull/292
[flatcar-779]: https://github.com/flatcar/Flatcar/issues/779
[image-builder]: https://github.com/kubernetes-sigs/image-builder
[kubenet]: https://github.com/flatcar/Flatcar/issues/579
[kubespray-documentation]: https://kubespray.io
[kured]: https://kured.dev/docs/
[openstack]: https://cluster-api-openstack.sigs.k8s.io/clusteropenstack/configuration.html#ignition-based-images
[sysext-bakery]: https://flatcar.github.io/sysext-bakery/
[typhoon]: https://typhoon.psdn.io/
