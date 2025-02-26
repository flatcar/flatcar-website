---
title: "High Availability Kubernetes"
date: 2025-02-13T16:30:38-05:00
draft: false
weight: 12
---

After you have created a kubernetes cluster using the [getting started
guide](./getting-started-with-kubernetes.md), we can take a look at a more
complex example that involves a highly available control plane nodes and
dedicated worker nodes.  The result will be similar to a [Typhoon][Typhoon]
cluster, but this version will be a little more "vanilla" and will run on
libvirt VMs, which is not mentioned in their documentation as of time of
writing.

## Architecture

This documentation will walk you through creating 5 VMs with the following
properties:

| VM Name       | Hostname     | IP             | Role          | Runtime |
| ---------     | ----------   | ----           | ------        | ------- |
| virt-node1-ha | node1-cp     | 192.168.122.31 | Control Plane | CRIO    |
| virt-node2-ha | node2-cp     | 192.168.122.32 | Control Plane | CRIO    |
| virt-node3-ha | node3-cp     | 192.168.122.33 | Control Plane | CRIO    |
| virt-node4-ha | node4-worker | 192.168.122.34 | Worker        | CRIO    |
| virt-node5-ha | node5-worker | 192.168.122.35 | Worker        | CRIO    |

### Control Plane

Each control plane node will be responsible for running the regular Kubernetes
control plane components, as well as HAProxy and Keepalived.  The api-server
with have a VIP of `192.168.122.30`.  HAProxy and Keepalived can be installed
through various methods, but this article will show you how to install them
using [Quadlet][Quadlet] through Ignition. 

### Bootstrap Sequence

We will install the necessary systemd files to use kubeadm to bootstrap a
cluster. This means essentially that `node1-cp` will run `kubeadm init ...`,
`node2-cp` and `node3-cp` will run `kubeadm join --control-plane ...`, and the
worker nodes will run `kubeadm join ...`.  This is a [very common pattern][HA K8S]
for bootstrapping a kubernetes cluster.

Typically, one node will call `kubeadm init ...`, then `kubeadm print
join-token`, which then can be copied between nodes.  The problem with this
approach is that it requires manual intervention at install-time which sort-of
defeats the purpose of Ignition. Luckily, we can provide all the information
ahead of time so nothing needs to be copied between nodes and the cluster
installation can still be secure and hands-off.

In order to do this, there are a few things that we need to pre-generate so
that we can pass them to the `kubeadm` commands via ignition. These are:

- /etc/kubernetes/pki/ca.crt
- /etc/kubernetes/pki/ca.key
- /etc/kubernetes/pki/sa.key
- /etc/kubernetes/pki/sa.pub
- /etc/kubernetes/pki/front-proxy-ca.crt
- /etc/kubernetes/pki/front-proxy-ca.key
- /etc/kubernetes/pki/etcd/ca.crt
- /etc/kubernetes/pki/etcd/ca.key

We also will generate an initial join token and hash of the CA and provide that
in an EnvironmentFile called `/etc/kubernetes/certs.conf`.

Fortunately, this can all be created via script, called
`generate-k8s-certs.sh`.  Before we talk about the script, we should
talk about the overall file structure.

## Files

Building the configuration files and VMs is not a small feat, so we should
create a dedicated workspace for this.

```bash
mkdir -p butane certs ign scripts
```

Now we can get started looking at our butane configs.

### Butane Structure

All of our butane files will be in the `butane` directory.  Each VM will have
its own butane file that will have the same name as the VM and it will depend
on one or more other butane file.  In order to get dependencies correct, the
base butane files will be prefixed by 2 numbers and they will be built in
numerical order.  This way, our butane files can depend on any file sorted
before it, but not after.  Files named `00_base*` should not depend on any
other butane config.  The final butane configs for the VMs should only depend
on these base configs.

```
> tree butane/
butane/
├── 00_base-k8s-token.yaml
├── 00_base-k8s.yaml
├── 10_base-ha.yaml
├── 20_base-ha-cp.yaml
├── 30_base-ha-init.yaml
├── 31_base-ha-join-cp.yaml
├── 32_base-ha-join.yaml
├── node1-ha.yaml
├── node2-ha.yaml
├── node3-ha.yaml
├── node4-ha.yaml
└── node5-ha.yaml
```

This already seems a bit unwieldy, so let's create a `Makefile` to help build everything.

### Makefile

<details><summary>Makefile</summary>

```Makefile
# Options are stable | alpha | beta
CHANNEL := stable

# Make sure to https://www.flatcar.org/docs/latest/installing/vms/qemu/#gentoo

TOKEN_FILE = butane/00_base-k8s-token.yaml
BUTANE = $(TOKEN_FILE) $(shell find butane -type f -not -name 'node*' | sort -h) $(shell find butane -type f -name "node*.yaml")
IGN = $(patsubst butane/%.yaml,ign/%.ign,$(BUTANE))

ifeq ($(shell command -v podman 2> /dev/null),)
    CR=docker
else
    CR=podman
endif

# Remove files that we can easily recreate
clean:
	rm -f flatcar_production_qemu_image.img.sig config.json ign/* /var/lib/libvirt/images/flatcar/*.ign

# Remove files that take longer to recreate/download
cleanclean: clean
	rm -f flatcar_production_qemu_image.img.fresh Flatcar_Image_Signing_Key.asc $(TOKEN_FILE)

.PHONY: cleanclean clean

Flatcar_Image_Signing_Key.asc:
	curl -L -O https://www.flatcar.org/security/image-signing-key/Flatcar_Image_Signing_Key.asc

verify-gpg: Flatcar_Image_Signing_Key.asc
	gpg --import --keyid-format LONG Flatcar_Image_Signing_Key.asc

.PHONY: verify-gpg

# Download and verify the image that we'll use as a base
flatcar_production_qemu_image.img.fresh:
	wget "https://${CHANNEL}.release.flatcar-linux.net/amd64-usr/current/flatcar_production_qemu_image.img"
	wget "https://${CHANNEL}.release.flatcar-linux.net/amd64-usr/current/flatcar_production_qemu_image.img.sig"
	gpg --verify flatcar_production_qemu_image.img.sig
	cp -f flatcar_production_qemu_image.img flatcar_production_qemu_image.img.fresh

# Create vm disks from the base image
%.qcow2: flatcar_production_qemu_image.img.fresh
	mkdir -p /var/lib/libvirt/images/flatcar
	qemu-img create -f qcow2 -F qcow2 -b $(shell pwd)/flatcar_production_qemu_image.img.fresh /var/lib/libvirt/images/flatcar/$@

# Convert butane configs to ignition configs
ign/%.ign:
	mkdir -p ign
	$(CR) run --rm -i -v $(shell pwd)/butane:/config/butane:ro -v $(shell pwd)/ign:/config/ign quay.io/coreos/butane:latest --pretty -d /config < butane/$*.yaml > $@

# Create VMs
virt-node%: flatcar_production_qemu_image-%.qcow2 $(IGN)
	cp -fv ign/*.ign /var/lib/libvirt/images/flatcar
	virt-install --connect qemu:///system --import --name $@  --ram 4096  --vcpus 4 --os-variant=generic --network network=default,model=virtio --disk path=/var/lib/libvirt/images/flatcar/flatcar_production_qemu_image-$*.qcow2,format=qcow2,bus=virtio --vnc --qemu-commandline="-fw_cfg name=opt/org.flatcar-linux/config,file=/var/lib/libvirt/images/flatcar/node$*.ign" --noautoconsole

# Don't delete intermediate files
.PRECIOUS: %.qcow2 ign/%.ign

# Stop and Remove VMs
rm-virt-node%:
	virsh destroy virt-node$* || :
	virsh undefine virt-node$*

# Create token butane file
butane/00_base-k8s-token.yaml:
	./scripts/generate-k8s-certs.sh

# Create all ignition configs
new-cluster: clean butane/00_base-k8s-token.yaml $(IGN)

# Create all VMs
ha: virt-node1-ha virt-node2-ha virt-node3-ha virt-node4-ha virt-node5-ha

# Stop and Remove all VMs
rm-ha: rm-virt-node1-ha rm-virt-node2-ha rm-virt-node3-ha rm-virt-node4-ha rm-virt-node5-ha

.PHONY: new-cluster ha rm-ha
```
</details>
<br>

This makefile is maybe a bit long, but we'll go through each piece in due time.
First, we should look at these lines:

```Makefile
TOKEN_FILE = butane/00_base-k8s-token.yaml
BUTANE = $(TOKEN_FILE) $(shell find butane -type f -not -name 'node*' | sort -h) $(shell find butane -type f -name "node*.yaml")
IGN = $(patsubst butane/%.yaml,ign/%.ign,$(BUTANE))
```

This is specifying our special token file that will contain all of our
certificates and such, as well as specifying the order in which our butane
files should be built.  Then, it uses path substitution to generate the name of
the resulting ignition files.

```Makefile
# Convert butane configs to ignition configs
ign/%.ign:
	mkdir -p ign
	$(CR) run --rm -i -v $(shell pwd)/butane:/config/butane:ro -v $(shell pwd)/ign:/config/ign quay.io/coreos/butane:latest --pretty -d /config < butane/$*.yaml > $@

# ...

# Create token butane file
butane/00_base-k8s-token.yaml:
	./scripts/generate-k8s-certs.sh
```

These lines show us how to to build each ignition file using a container.  We
also have to specify how to build our token file using a shell script.

### Token File

Generating the token file is a fun exercise using `openssl`, yaml, and bash
heredocs.  In case you actually value your time, the script is provided here in
full.  As always, please make sure you understand what commands you are running
before running a script you found on the internet.

<details><summary>scripts/generate-k8s-certs.sh</summary>

```bash
#!/usr/bin/env bash

set -e

# Set file paths
cert_dir="./certs"
output_yaml="butane/00_base-k8s-token.yaml"

# Create cert directory
mkdir -p "$cert_dir"

# Generate the token
token=$(echo "$(tr -dc 'a-z0-9' < /dev/urandom | head -c 6).$(tr -dc 'a-z0-9' < /dev/urandom | head -c 16)")
encoded_token=$(echo -n "$token" | base64)

# Generate Kubernetes CA (used for cluster signing)
openssl req -x509 -newkey rsa:2048 -keyout "$cert_dir/ca.key" -out "$cert_dir/ca.crt" -days 365 -nodes -subj "/CN=k8s-ca"

# Generate Front Proxy CA (used for API server aggregation)
openssl req -x509 -newkey rsa:2048 -keyout "$cert_dir/front-proxy-ca.key" -out "$cert_dir/front-proxy-ca.crt" -days 365 -nodes -subj "/CN=front-proxy-ca"

# Generate Service Account Signing Key
openssl genrsa -out "$cert_dir/sa.key" 2048
openssl rsa -in "$cert_dir/sa.key" -pubout -out "$cert_dir/sa.pub"

# Generate API server certificate (signed by Kubernetes CA)
openssl req -new -newkey rsa:2048 -keyout "$cert_dir/apiserver.key" -out "$cert_dir/apiserver.csr" -nodes -subj "/CN=kube-apiserver"
openssl x509 -req -in "$cert_dir/apiserver.csr" -CA "$cert_dir/ca.crt" -CAkey "$cert_dir/ca.key" -CAcreateserial -out "$cert_dir/apiserver.crt" -days 365

# Generate etcd CA (if using external etcd)
openssl req -x509 -newkey rsa:2048 -keyout "$cert_dir/etcd-ca.key" -out "$cert_dir/etcd-ca.crt" -days 365 -nodes -subj "/CN=etcd-ca"

indent="          "

# Encode certificates for YAML
ca_crt=$(sed "s/^/${indent}/" "$cert_dir/ca.crt")
ca_key=$(sed "s/^/${indent}/" "$cert_dir/ca.key")
front_proxy_ca_crt=$(sed "s/^/${indent}/" "$cert_dir/front-proxy-ca.crt")
front_proxy_ca_key=$(sed "s/^/${indent}/" "$cert_dir/front-proxy-ca.key")
sa_key=$(sed "s/^/${indent}/" "$cert_dir/sa.key")
sa_pub=$(sed "s/^/${indent}/" "$cert_dir/sa.pub")
etcd_ca_crt=$(sed "s/^/${indent}/" "$cert_dir/etcd-ca.crt")
etcd_ca_key=$(sed "s/^/${indent}/" "$cert_dir/etcd-ca.key")

# Compute CA hash
ca_hash="sha256:$(openssl x509 -pubkey -in "$cert_dir/ca.crt" | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -hex | sed 's/^.* //')"
encoded_base64_ca_hash=$(echo -n "$ca_hash" | base64 -w 0)

# Write the header to the output YAML file
cat > "$output_yaml" <<-EOF
---
# This is generated using generate-k8s-certs.sh
variant: flatcar
version: 1.1.0
storage:
  files:
    - path: /etc/kubernetes/pki/ca.crt
      contents:
        inline: |
$ca_crt
    - path: /etc/kubernetes/pki/ca.key
      contents:
        inline: |
$ca_key
    - path: /etc/kubernetes/pki/front-proxy-ca.crt
      contents:
        inline: |
$front_proxy_ca_crt
    - path: /etc/kubernetes/pki/front-proxy-ca.key
      contents:
        inline: |
$front_proxy_ca_key
    - path: /etc/kubernetes/pki/sa.key
      contents:
        inline: |
$sa_key
    - path: /etc/kubernetes/pki/sa.pub
      contents:
        inline: |
$sa_pub
    - path: /etc/kubernetes/pki/etcd/ca.crt
      contents:
        inline: |
$etcd_ca_crt
    - path: /etc/kubernetes/pki/etcd/ca.key
      contents:
        inline: |
$etcd_ca_key
    - path: /etc/kubernetes/certs.conf
      contents:
        inline: |
            K8S_TOKEN='$token'
            K8S_HASH='$ca_hash'
EOF

echo "Kubernetes certificates have been generated successfully!"
echo "YAML file '$output_yaml' has been successfully overwritten!"
```
</details>
<br>

Now we we can save this script in `scripts/generate-k8s-certs.sh` run `make
butane/00_base-k8s-token.yaml` and check out our SSL goodies.  Treat this file
like a password.  If it gets made public (for anything other than test
clusters) make sure you recreate them. It's usually recommended to not provide
sensitive information via Ignition configuration files. This is only for demo
purposes.

### Butane Content

Now that we have the basic structure in place, we can get started filling out
the content of our butane files. We will first look at the "base" configs,
then look at node specific configs.

#### Base

<br>

<details><summary>butane/00_base-k8s.yaml</summary>

```yaml
variant: flatcar
version: 1.1.0
storage:
  links:
    - path: /etc/extensions/docker-flatcar.raw
      target: /dev/null
      overwrite: true
    - path: /etc/extensions/containerd-flatcar.raw
      target: /dev/null
      overwrite: true
    - target: /opt/extensions/crio/crio-v1.31.3-x86-64.raw
      path: /etc/extensions/crio.raw
      hard: false
    - target: /opt/extensions/kubernetes/kubernetes-v1.31.3-x86-64.raw
      path: /etc/extensions/kubernetes.raw
      hard: false
  files:
    - path: /etc/flatcar/enabled-sysext.conf
      contents:
        inline: |
          zfs
          podman
      mode: 0644
    - path: /etc/sysupdate.d/noop.conf
      contents:
        source: https://github.com/flatcar/sysext-bakery/releases/download/latest/noop.conf
    - path: /opt/extensions/crio/crio-v1.31.3-x86-64.raw
      mode: 0644
      contents:
        source: https://github.com/flatcar/sysext-bakery/releases/download/latest/crio-v1.31.3-x86-64.raw
    - path: /etc/sysupdate.crio.d/crio.conf
      contents:
        source: https://github.com/flatcar/sysext-bakery/releases/download/latest/crio.conf
    - path: /etc/sysupdate.kubernetes.d/kubernetes-v1.31.conf
      contents:
        source: https://github.com/flatcar/sysext-bakery/releases/download/latest/kubernetes-v1.31.conf
    - path: /opt/extensions/kubernetes/kubernetes-v1.31.3-x86-64.raw
      contents:
        source: https://github.com/flatcar/sysext-bakery/releases/download/latest/kubernetes-v1.31.3-x86-64.raw
    - path: /opt/bin/cilium.tar
      mode: 0755
      contents:
        source: https://github.com/cilium/cilium-cli/releases/download/v0.16.24/cilium-linux-amd64.tar.gz
        compression: gzip
systemd:
  units:
    - name: systemd-sysupdate.timer
      enabled: true
    - name: locksmithd.service
      # NOTE: To coordinate the node reboot in this context, we recommend to use Kured.
      mask: true
    - name: systemd-sysupdate.service
      dropins:
        - name: kubernetes.conf
          contents: |
            [Service]
            ExecStartPre=/usr/bin/sh -c "readlink --canonicalize /etc/extensions/kubernetes.raw > /tmp/kubernetes"
            ExecStartPre=/usr/lib/systemd/systemd-sysupdate -C kubernetes update
            ExecStartPost=/usr/bin/sh -c "readlink --canonicalize /etc/extensions/kubernetes.raw > /tmp/kubernetes-new"
            ExecStartPost=/usr/bin/sh -c "if ! cmp --silent /tmp/kubernetes /tmp/kubernetes-new; then touch /run/reboot-required; fi"
        - name: crio.conf
          contents: |
            [Service]
            ExecStartPre=/usr/bin/sh -c "readlink --canonicalize /etc/extensions/crio.raw > /tmp/crio"
            ExecStartPre=/usr/lib/systemd/systemd-sysupdate -C crio update
            ExecStartPost=/usr/bin/sh -c "readlink --canonicalize /etc/extensions/crio.raw > /tmp/crio-new"
            ExecStartPost=/usr/bin/sh -c "if ! cmp --silent /tmp/crio /tmp/crio-new; then touch /run/reboot-required; fi"
    - name: cilium-setup.service
      enabled: true
      contents: |
        [Unit]
        Description=Download and install Cilium
        After=network-online.target
        Wants=network-online.target

        [Service]
        Type=oneshot
        ExecStart=/bin/sh -c 'tar -C /opt/bin -xf /opt/bin/cilium.tar'
        RemainAfterExit=true

        [Install]
        WantedBy=multi-user.target
    - name: zfs-setup.service
      enabled: true
      contents: |
        [Unit]
        Description=Load zfs kernel modules
        After=local-fs-pre.target
        Wants=local-fs-pre.target

        [Service]
        Type=oneshot
        ExecStart=/usr/bin/modprobe zfs
        RemainAfterExit=true

        [Install]
        WantedBy=multi-user.target
```
</details>
<br>

This base config does a couple of things.  It disables the `docker` and
`containerd` sysexts, installs `kubernetes` and `crio` sysexts, and enables
the `zfs` and `podman` sysexts. It also creates a systemd unit to download the
cilium cli. This cli may only be needed on the first node, but we install it
on all hosts to make day 2 operations easier. We also disable `locksmithd` to
prepare for using [Kured][Kured].

<details><summary>butane/10_base-ha.yaml</summary>

```yaml
variant: flatcar
version: 1.1.0
ignition:
  config:
    merge:
      - local: ign/00_base-k8s.ign
      - local: ign/00_base-k8s-token.ign
storage:
  files:
    - path: /etc/kubernetes/kubeadm-env.conf
      mode: 0644
      contents:
        inline: |
          K8S_APISERVER_URL="192.168.122.30"
    - path: /etc/containers/policy.json
      contents:
        inline: |
          {
            "default": [
              {
                "type": "insecureAcceptAnything"
              }
            ]
          }
```
</details>
<br>

We extend the first config by including it in this config, along with the token
file.  We also set any environment variales that are shared across hosts, in
this case `K8S_APISERVER_URL`, as well as set up some default podman/crio
policies.

<details><summary>butane/20_base-ha-cp.yaml</summary>

```yaml
variant: flatcar
version: 1.1.0
ignition:
  config:
    merge:
      - local: ign/10_base-ha.ign
storage:
  files:
    - path: /etc/keepalived/check_apiserver.sh
      mode: 0755
      contents:
        inline: |
          #!/bin/bash
          curl --silent --max-time 2 --insecure https://localhost:6443/healthz -o /dev/null || exit 1
    - path: /etc/containers/systemd/keepalived.container
      contents:
        inline: |
          [Unit]
          Description=Keepalived Container
          Requires=crio.service
          After=crio.service

          [Container]
          Image=docker.io/osixia/keepalived:latest
          AutoUpdate=registry
          AddCapability=NET_ADMIN
          AddCapability=NET_BROADCAST
          AddCapability=NET_RAW
          PodmanArgs=--privileged
          Exec=--copy-service
          Volume=/etc/keepalived/keepalived.conf:/container/service/keepalived/assets/keepalived.conf:ro
          Volume=/etc/keepalived/check_apiserver.sh:/etc/keepalived/check_apiserver.sh:ro
          Network=host

          [Service]
          Restart=always
          RestartSec=30

          [Install]
          WantedBy=multi-user.target default.target
    - path: /etc/containers/systemd/haproxy.container
      contents:
        inline: |
          [Unit]
          Description=HAProxy Container
          Requires=keepalived.service
          After=keepalived.service

          [Container]
          Image=docker.io/library/haproxy:alpine
          AutoUpdate=registry
          Network=host
          Volume=/etc/haproxy/haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro

          [Service]
          Restart=always
          RestartSec=30

          [Install]
          WantedBy=multi-user.target default.target
    - path: /etc/haproxy/haproxy.cfg
      contents:
        inline: |
          # /etc/haproxy/haproxy.cfg
          #---------------------------------------------------------------------
          # Global settings
          #---------------------------------------------------------------------
          global
              log stdout format raw local0
              daemon

          #---------------------------------------------------------------------
          # common defaults that all the 'listen' and 'backend' sections will
          # use if not designated in their block
          #---------------------------------------------------------------------
          defaults
              mode                    http
              log                     global
              option                  httplog
              option                  dontlognull
              option http-server-close
              option forwardfor       except 127.0.0.0/8
              option                  redispatch
              retries                 1
              timeout http-request    10s
              timeout queue           20s
              timeout connect         5s
              timeout client          35s
              timeout server          35s
              timeout http-keep-alive 10s
              timeout check           10s

          #---------------------------------------------------------------------
          # apiserver frontend which proxys to the control plane nodes
          #---------------------------------------------------------------------
          frontend apiserver
              bind 192.168.122.30:6444
              mode tcp
              option tcplog
              default_backend apiserverbackend

          #---------------------------------------------------------------------
          # round robin balancing for apiserver
          #---------------------------------------------------------------------
          backend apiserverbackend
              mode tcp
              balance     roundrobin
              
              server node1-cp 192.168.122.31:6443 check verify none
              server node2-cp 192.168.122.32:6443 check verify none
              server node3-cp 192.168.122.33:6443 check verify none
systemd:
  units:
    - name: ip_vs-setup.service
      enabled: true
      contents: |
        [Unit]
        Description=Load ip_vs kernel modules
        After=local-fs-pre.target
        Wants=local-fs-pre.target

        [Service]
        Type=oneshot
        ExecStart=/usr/bin/modprobe ip_vs
        RemainAfterExit=true

        [Install]
        WantedBy=multi-user.target
```

</details>
<br>

Here we are defining services that should be running on each of the control
plane nodes.  We specify keepalived and haproxy containers that should be
running via Quadlet.  These need to be running before kubernetes so its easier
to define them here.  We also specify the haproxy config since it will be the
same across all nodes, but we don't specify the keepalived config.  That will
be different per node because it will include the nodes ip address and
rankings.  Finally we make sure to run `modprobe ip_vs` which is required when
running keepalived.

<details><summary>butane/30_base-ha-init.yaml</summary>

```yaml
variant: flatcar
version: 1.1.0
ignition:
  config:
    merge:
      - local: ign/20_base-ha-cp.ign
storage:
  files:
systemd:
  units:
    - name: kubeadm.service
      enabled: false
      contents: |
        [Unit]
        StartLimitInterval=200
        StartLimitBurst=5
        Description=Kubeadm service
        Requires=haproxy.service
        After=haproxy.service
        ConditionPathExists=!/etc/kubernetes/kubelet.conf
        [Service]
        EnvironmentFile=/etc/kubernetes/kubeadm-env.conf
        EnvironmentFile=/etc/kubernetes/certs.conf
        # We skip kube-proxy because we install cilium
        ExecStartPre=/usr/bin/kubeadm init --token ${K8S_TOKEN} --cri-socket=unix:///var/run/crio/crio.sock --skip-phases=addon/kube-proxy --control-plane-endpoint ${K8S_APISERVER_URL}:6444 --upload-certs
        ExecStartPre=/usr/bin/mkdir /home/core/.kube
        ExecStartPre=/usr/bin/cp /etc/kubernetes/admin.conf /home/core/.kube/config
        ExecStart=/usr/bin/chown -R core:core /home/core/.kube
        [Install]
        WantedBy=multi-user.target
    - name: cilium-install-cluster.service
      enabled: true
      contents: |
        [Unit]
        Description=Install Cilium as Kubernetes CNI
        Requires=kubeadm.service
        After=kubeadm.service
        [Service]
        Environment=KUBECONFIG='/home/core/.kube/config'
        ExecStart=/opt/bin/cilium install --set kubeProxyReplacement=true --namespace=kube-system
        [Install]
        WantedBy=multi-user.target
```

</details>
<br>

This service defines what to do when intializing the kubernetes cluster.  This
only needs to be run on one node.  Essentially we are calling `kubeadm init
...` and `cilium install ...`, but its worth pointing out the dependencies
here. We specify that kubeadm should only start AFTER the haproxy service
(which is generated after we specify the haproxy container) because that is
load-balancing our api-server VIP that's defined by keepalived. We also don't
install Cilium to the cluster until there is a cluster to install to. So
cilium can't start until kubeadm starts, kubeadm can't start until haproxy
starts, and haproxy can't start until keepalived starts. This ordering is
important for an HA control plane.
        
In the `kubeadm init ...` command, we also specify variables that are defined
in `EnvironmentFile=/etc/kubernetes/kubeadm-env.conf` and
`EnvironmentFile=/etc/kubernetes/certs.conf`. This ensures we are using the
same secrets across all nodes, and since we pre-generated them, no information
needs to be copied from node to node.

<details><summary>butane/31_base-ha-join-cp.yaml</summary>

```yaml
variant: flatcar
version: 1.1.0
ignition:
  config:
    merge:
      - local: ign/20_base-ha-cp.ign
storage:
  files:
systemd:
  units:
    - name: kubeadm.service
      enabled: true
      contents: |
        [Unit]
        StartLimitInterval=200
        StartLimitBurst=5
        Description=Kubeadm service
        Requires=crio.service
        After=crio.service
        ConditionPathExists=!/etc/kubernetes/kubelet.conf
        [Service]
        Restart=always
        RestartSec=30
        EnvironmentFile=/etc/kubernetes/certs.conf
        EnvironmentFile=/etc/kubernetes/kubeadm-env.conf
        ExecStartPre=/usr/bin/kubeadm config images pull
        # Wait until first control plane is up
        ExecStartPre=/usr/bin/sh -c "while ! nc -z ${K8S_APISERVER_URL} 6444; do sleep 5; done"
        ExecStart=/usr/bin/kubeadm join ${K8S_APISERVER_URL}:6444 --token ${K8S_TOKEN} --discovery-token-ca-cert-hash ${K8S_HASH} --ignore-preflight-errors=FileAvailable--etc-kubernetes-pki-ca.crt --cri-socket=unix:///var/run/crio/crio.sock --control-plane --certificate-key ${K8S_CERT_KEY}
        [Install]
        WantedBy=multi-user.target
```

</details>
<br>

This config specifies how to join the cluster as a control plane node using the
information in the same `EnvironmentFile`s. We also specify a `ExecStartPre`
which essentially just sleeps until the first nodes api-server is available.

<details><summary>butane/32_base-ha-join.yaml</summary>

```yaml
variant: flatcar
version: 1.1.0
ignition:
  config:
    merge:
      - local: ign/10_base-ha.ign
systemd:
  units:
    - name: kubeadm.service
      enabled: true
      contents: |
        [Unit]
        StartLimitInterval=200
        StartLimitBurst=5
        Description=Kubeadm service
        Requires=crio.service
        After=crio.service
        ConditionPathExists=!/etc/kubernetes/kubelet.conf
        [Service]
        Restart=always
        RestartSec=30
        EnvironmentFile=/etc/kubernetes/certs.conf
        EnvironmentFile=/etc/kubernetes/kubeadm-env.conf
        ExecStartPre=/usr/bin/kubeadm config images pull
        ExecStartPre=/usr/bin/sh -c "while ! nc -z ${K8S_APISERVER_URL} 6444; do sleep 5; done"
        ExecStart=/usr/bin/kubeadm join ${K8S_APISERVER_URL}:6444 --token ${K8S_TOKEN} --discovery-token-ca-cert-hash ${K8S_HASH} --ignore-preflight-errors=FileAvailable--etc-kubernetes-pki-ca.crt --cri-socket=unix:///var/run/crio/crio.sock
        [Install]
        WantedBy=multi-user.target
```

</details>
<br>

This is similar to the previous command, but we join as a worker node, not a
control plane.

#### Node

<br>

<details><summary>butane/node1-ha.yaml</summary>

```yaml
variant: flatcar
version: 1.1.0
ignition:
  config:
    merge:
      - local: ign/30_base-ha-init.ign
storage:
  files:
    - path: /etc/hostname
      overwrite: true
      contents:
        inline: node1-cp
    - path: /etc/systemd/network/00-eth0.network
      contents:
        inline: |
          [Match]
          Name=eth0

          [Network]
          Address=192.168.122.31/24
          Gateway=192.168.122.1
          DNS=192.168.122.1
    - path: /etc/keepalived/keepalived.conf
      mode: 0644
      contents:
        inline: |
          ! /etc/keepalived/keepalived.conf
          ! Configuration File for keepalived
          global_defs {
              router_id LVS_DEVEL
          }
          vrrp_script check_apiserver {
            script "/etc/keepalived/check_apiserver.sh"
            interval 3
            weight -2
            fall 10
            rise 2
          }
          vrrp_instance VI_1 {
              state MASTER
              interface eth0
              virtual_router_id 51
              priority 101
              authentication {
                  auth_type PASS
                  auth_pass kubevip
              }
              virtual_ipaddress {
                  192.168.122.30/24
              }
              track_script {
                  check_apiserver
              }
          }
```

</details>
<br>

Here we define the first node. We are including everything from the
`ign/30_base-ha-init.ign` config, as well as defining our hostname and static
IP. We also provide the keepalived config that specifies this node as the
`MASTER`.

<details><summary>butane/node2-ha.yaml</summary>

```yaml
variant: flatcar
version: 1.1.0
ignition:
  config:
    merge:
      - local: ign/31_base-ha-join-cp.ign
storage:
  files:
    - path: /etc/hostname
      overwrite: true
      contents:
        inline: node2-cp
    - path: /etc/systemd/network/00-eth0.network
      contents:
        inline: |
          [Match]
          Name=eth0

          [Network]
          Address=192.168.122.32/24
          Gateway=192.168.122.1
          DNS=192.168.122.1
    - path: /etc/keepalived/keepalived.conf
      mode: 0644
      contents:
        inline: |
          ! /etc/keepalived/keepalived.conf
          ! Configuration File for keepalived
          global_defs {
              router_id LVS_DEVEL
          }
          vrrp_script check_apiserver {
            script "/etc/keepalived/check_apiserver.sh"
            interval 3
            weight -2
            fall 10
            rise 2
          }
          vrrp_instance VI_1 {
              state MASTER
              interface eth0
              virtual_router_id 51
              priority 100
              authentication {
                  auth_type PASS
                  auth_pass kubevip
              }
              virtual_ipaddress {
                  192.168.122.30/24
              }
              track_script {
                  check_apiserver
              }
          }
```

</details>
<br>

<details><summary>butane/node3-ha.yaml</summary>

```yaml
variant: flatcar
version: 1.1.0
ignition:
  config:
    merge:
      - local: ign/31_base-ha-join-cp.ign
storage:
  files:
    - path: /etc/hostname
      overwrite: true
      contents:
        inline: node3-cp
    - path: /etc/systemd/network/00-eth0.network
      contents:
        inline: |
          [Match]
          Name=eth0

          [Network]
          Address=192.168.122.33/24
          Gateway=192.168.122.1
          DNS=192.168.122.1
    - path: /etc/keepalived/keepalived.conf
      mode: 0644
      contents:
        inline: |
          ! /etc/keepalived/keepalived.conf
          ! Configuration File for keepalived
          global_defs {
              router_id LVS_DEVEL
          }
          vrrp_script check_apiserver {
            script "/etc/keepalived/check_apiserver.sh"
            interval 3
            weight -2
            fall 10
            rise 2
          }
          vrrp_instance VI_1 {
              state MASTER
              interface eth0
              virtual_router_id 51
              priority 99
              authentication {
                  auth_type PASS
                  auth_pass kubevip
              }
              virtual_ipaddress {
                  192.168.122.30/24
              }
              track_script {
                  check_apiserver
              }
          }
```

</details>
<br>

These two files are similar in that they define the other two control plane
nodes. The main differences are the hostnames, IPs, and the priority in the
keepalived config.

<details><summary>butane/node4-ha.yaml</summary>

```yaml
variant: flatcar
version: 1.1.0
ignition:
  config:
    merge:
      - local: ign/32_base-ha-join.ign
storage:
  files:
    - path: /etc/hostname
      overwrite: true
      contents:
        inline: node4-worker
    - path: /etc/systemd/network/00-eth0.network
      contents:
        inline: |
          [Match]
          Name=eth0

          [Network]
          Address=192.168.122.34/24
          Gateway=192.168.122.1
          DNS=192.168.122.1
```

</details>
<br>

<details><summary>butane/node5-ha.yaml</summary>

```yaml
variant: flatcar
version: 1.1.0
ignition:
  config:
    merge:
      - local: ign/32_base-ha-join.ign
storage:
  files:
    - path: /etc/hostname
      overwrite: true
      contents:
        inline: node5-worker
    - path: /etc/systemd/network/00-eth0.network
      contents:
        inline: |
          [Match]
          Name=eth0

          [Network]
          Address=192.168.122.35/24
          Gateway=192.168.122.1
          DNS=192.168.122.1
```

</details>
<br>

These final two configs specify the worker nodes. Each inherits
`ign/32_base-ha-join.ign`, so we only need to specify the hostname and IP
addresses.

## Running

Now that we have all of our files defined, we can actually spin up the cluster.
We start by downloading the VM image, generating the configs, and running the
VMs.

NOTE: You may want to run these make commands as root, depending on how
your permissions are setup with libvirt, but again, make sure you understand
what the commands are doing before you run them. There is no lifeguard at the
pool.

Running `make verify-gpg` should download flatcars GPG key and import it.
Then, running `make new-cluster` should generate our token file and generate
all the Ignition files from the butane configs.  Finally, running `make ha`
will create and run each VM.  This involves downloading a base VM image,
verifying it with GPG, cloning the base image to create a working image, and
copying the image (and Igntion files) to `/var/lib/libvirt/images/flatcar`.

After that, we should have a running kubernetes cluster.  We can shut
everything down by running `make rm-ha` or connect to a node via `virsh connect
virt-node1-ha`.  Once we are in the first node we can run commands like
`kubectl get nodes` or `cilium status` to see the status of the cluster.  Do
note, however, that this may take some time for everything to settle.  Each
node will be downloading things from the internet and automatically registering
itself so you may not see all the nodes or see cilium in an error state for a
few minutes.

Once everything has settled, you can create an example deployment by running
`kubectl apply -f
https://raw.githubusercontent.com/kubernetes/website/main/content/en/examples/controllers/nginx-deployment.yaml`.

That's it!  You now have a fully functional, highly available kubernetes
cluster running on your VMs!

[Typhoon]: https://typhoon.psdn.io
[Quadlet]: https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html
[HA K8S]: https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/high-availability/
[Kured]: https://kured.dev/
