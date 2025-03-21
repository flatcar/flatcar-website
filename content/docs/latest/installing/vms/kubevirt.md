---
title: Running Flatcar Container Linux on KubeVirt
linktitle: Running on KubeVirt
weight: 30
---

_While we always welcome community contributions and fixes, please note that KubeVirt is not an officially supported platform at this time because the release tests don't run for it. (See the [platform overview](/#installing-flatcar).)_

These instructions will walk you through running Flatcar Container Linux on KubeVirt.

## Choose a channel

Flatcar Container Linux is designed to be updated automatically with different schedules per channel. You can [disable this feature][update-strategies], although we don't recommend it. Read the [release notes][release-notes] for specific features and bug fixes.

KubeVirt OEM images are created for both amd64 and arm64 and come in qcow2 compressed format.

How to download a KubeVirt qcow2 image file:

```bash
# KubeVirt image is available for download from the alpha version 3975.0.0
wget https://alpha.release.flatcar-linux.net/amd64-usr/3975.0.0/flatcar_production_kubevirt_image.qcow2
```

## Preparing the Kubernetes cluster

Firstly, KubeVirt needs to be installed on your Kubernetes cluster - see [kubevirt-docs](https://kubevirt.io/user-guide).
Secondly, CDI needs to be installed and `virtctl` needs to be present on your upload machine, to be able to create the PVC (Persistent Volume Claim) using the qcow2 image - see [KubeVirt CDI](https://kubevirt.io/user-guide/operations/containerized_data_importer/).

Let's create the PVC from the downloaded image using `virtctl`:

```bash
virtctl image-upload pvc flatcar-production-kubevirt-image --size=10Gi --image-path=flatcar_production_kubevirt_image.qcow2 \
    --uploadproxy-url https://cdi-uploadproxy:31001 --insecure
```

Alternatively, we can use a PVC CRD entity (note the cdi.kubevirt.io/storage.import.endpoint annotation):

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: "flatcar-amd64-3975"
  labels:
    app: containerized-data-importer
  annotations:
    cdi.kubevirt.io/storage.import.endpoint: "https://alpha.release.flatcar-linux.net/amd64-usr/3975.0.0/flatcar_production_kubevirt_image.qcow2"
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: ceph-block
```

For provisioning, the Flatcar KubeVirt image supports both [cloud-init](https://cloudinit.readthedocs.io/en/latest/explanation/format.html) and [Ignition](https://coreos.github.io/ignition/getting-started/#providing-a-config) userdata formats.

## Deploying a new virtual machine on KubeVirt using OpenStack userdata config drive

KubeVirt VM definition yaml - vm-flatcar-cfgdrive.yaml:

```yaml
apiVersion: kubevirt.io/v1
kind: VirtualMachine
metadata:
  generation: 1
  labels:
    kubevirt.io/os: linux
  name: vm-flatcar-cfgdrive
spec:
  running: true
  template:
    metadata:
      creationTimestamp: null
      labels:
        kubevirt.io/domain: vm-flatcar-cfgdrive
    spec:
      domain:
        cpu:
          cores: 1
        devices:
          disks:
          - disk:
              bus: virtio
            name: disk0
          - disk:
              bus: sata
            name: cloudinitdisk
        resources:
          requests:
            memory: 1024M
      volumes:
      - name: disk0
        persistentVolumeClaim:
          claimName: flatcar-amd64-3975
      - cloudInitConfigDrive:
          userData: |
            #!/bin/bash
            echo "core:foo" | chpasswd
        name: cloudinitdisk
```

Then, we can apply the VM definition and we should be able to connect to it with username/password - core/foo.

```bash
kubectl apply -f vm-flatcar-cfgdrive.yaml
```

## Deploying a new virtual machine on KubeVirt using Ignition userdata config drive

The [Butane](https://coreos.github.io/butane/) configuration used to generate the Ignition configuration:

```yaml
variant: flatcar
version: 1.0.0
kernel_arguments:
  should_exist:
    - flatcar.autologin
passwd:
  users:
    - name: core
      password_hash: $6$sn3ZSJJJln5JkAZb$VDTKzLpCyjlEe7Kh0DKjOnEawkkOoi0tOKVbcCv0FIWSf3u9Y1p1I5YdJJ5L8uDmmMvO2CBlmJZNdxFuekjjE1
```

The `password_hash` was obtained by running `mkpasswd`.

To obtain the `userData` content, `butane` is required to convert it:

```bash
butane < userdata.yaml > userdata.json
cat userdata.json
# {"ignition":{"version":"3.3.0"},"kernelArguments":{"shouldExist":["flatcar.autologin"]},"passwd":{"users":[{"name":"core","passwordHash":"$6$sn3ZSJJJln5JkAZb$VDTKzLpCyjlEe7Kh0DKjOnEawkkOoi0tOKVbcCv0FIWSf3u9Y1p1I5YdJJ5L8uDmmMvO2CBlmJZNdxFuekjjE1"}]}}
```

KubeVirt VM definition yaml - vm-flatcar-ignition.yaml:

```yaml
apiVersion: kubevirt.io/v1
kind: VirtualMachine
metadata:
  generation: 1
  labels:
    kubevirt.io/os: linux
  name: vm-flatcar-ignition
spec:
  running: true
  template:
    metadata:
      labels:
        kubevirt.io/domain: vm-flatcar-ignition
    spec:
      domain:
        cpu:
          cores: 1
        devices:
          disks:
          - disk:
              bus: virtio
            name: disk0
          - cdrom:
              bus: sata
              readonly: true
            name: cloudinitdisk
        resources:
          requests:
            memory: 1024M
      volumes:
      - name: disk0
        persistentVolumeClaim:
          claimName: flatcar-amd64-3975
      - cloudInitConfigDrive:
          userData: |
            {"ignition":{"version":"3.3.0"},"kernelArguments":{"shouldExist":["flatcar.autologin"]},"passwd":{"users":[{"name":"core","passwordHash":"$6$sn3ZSJJJln5JkAZb$VDTKzLpCyjlEe7Kh0DKjOnEawkkOoi0tOKVbcCv0FIWSf3u9Y1p1I5YdJJ5L8uDmmMvO2CBlmJZNdxFuekjjE1"}]}}
        name: cloudinitdisk
```

Then, we can apply the VM definition and we should be able to connect to it with username/password - core/foo.
The VM is set via Ignition to autologin the core user at boot.

```bash
kubectl apply -f vm-flatcar-ignition.yaml
```

## Using Flatcar Container Linux

Now that you have a KubeVirt machine booted it is time to play around. Check out the [Flatcar Container Linux Quickstart][quickstart] guide or dig into [more specific topics][doc-index].

[update-strategies]: ../../setup/releases/update-strategies
[release-notes]: https://flatcar-linux.org/releases
[quickstart]: ../
[doc-index]: ../../
