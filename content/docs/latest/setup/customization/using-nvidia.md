---
title: Using NVIDIA GPUs on Flatcar
description: How to use and customize the NVIDIA driver on Flatcar
weight: 30
---

### Installation

Flatcar Container Linux offers support for the installation and customization of NVIDIA drivers for Tesla GPUs (both in VMs and on bare metal). Please take note that NVIDIA drivers have been migrated from being solely available on AWS and Azure to being accessible on all platforms with the release of version 3637.0.0. If you are using an older version, please be aware that it is restricted to AWS and Azure only.

Currently, there are two ways of installing NVIDIA drivers. First is using the built in `nvidia.service`, which automatically compiles the drivers from source on the first boot. Second is via an [official][official-sysext] NVIDIA drivers sysext, which contains prebuilt drivers, speeding up the provisioning. When using secure boot, only the prebuilt sysext will work, as the modules are signed.

We recommend using the prebuilt sysexts, but the `nvidia.service` is kept for backwards compatibility.

### `nvidia.service` method

During the initial boot, the `nvidia.service` automates hardware detection and triggers driver installation within a dedicated Flatcar developer container, ensuring a streamlined process. The current version of the installed NVIDIA driver can be found in the `/usr/share/flatcar/nvidia-metadata` file, assuming it's a vanilla installation and the version hasn't been customized (see below).

Since the installation is triggered after boot, the overall installation time is around 5-10 minutes. To check the installation status, use the following command:

```
# journalctl -u nvidia -f
```

To customize the version number of the NVIDIA driver, you can override the value in the `/etc/flatcar/nvidia-metadata` file by specifying the desired version in the `NVIDIA_DRIVER_VERSION`. However, it's important to ensure that the chosen driver version is compatible with the GPU hardware present in the instance.
E.g., for older GPUs the 460 driver series is needed because the latest drivers dropped support for them.

```
echo "NVIDIA_DRIVER_VERSION=460.106.00" | sudo tee /etc/flatcar/nvidia-metadata
sudo systemctl restart nvidia
```

**Butane Config**

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /etc/flatcar/nvidia-metadata
      mode: 0644
      contents:
        inline: |
          NVIDIA_DRIVER_VERSION=460.106.00
```

### Prebuilt sysext method

Flatcar provides official NVIDIA drivers sysext, built with every Flatcar release. As the kernel modules are built together with the kernel, they are signed with the ephemeral kernel modules signing key, which is important for secure boot support. During provisioning, the NVIDIA drivers sysext is downloaded and activated. The `nvidia.service` automatically detects an NVIDIA sysext has already been loaded and skips downloading and building them from source (therefore the version specified in `NVIDIA_DRIVER_VERSION` will be ignored).

The drivers come in two flavours: open and non-open for `amd64` architecture.  

You can find the latest `nvidia-runtime` releases [here][flatcar-sysext-bakery-nvidia-runtime].

To activate the NVIDIA sysext:
```yaml
---
# config.yaml
# butane < config.yaml > config.json
variant: flatcar
version: 1.0.0

storage:
  files:
    - path: /etc/flatcar/enabled-sysext.conf
      contents:
        inline: |
          nvidia-drivers-570-open
    - path: /opt/extensions/nvidia-runtime/nvidia-runtime-v1.17.9-x86-64.raw
      mode: 0644
      contents:
        source: https://extensions.flatcar.org/extensions/nvidia-runtime-v1.17.9-x86-64.raw
  links:
    - target: /opt/extensions/nvidia-runtime/nvidia-runtime-v1.17.9-x86-64.raw
      path: /etc/extensions/nvidia-runtime.raw
      hard: false
```

### Testing

Once the installation is complete (either via `nvidia.service` or sysext), you will have access to various NVIDIA commands. To verify the installation, run the command:

```bash
nvidia-smi
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 570.181                Driver Version: 570.181        CUDA Version: 12.8     |
|-----------------------------------------+------------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |
|                                         |                        |               MIG M. |
|=========================================+========================+======================|
|   0  NVIDIA L40S                    Off |   00000000:05:00.0 Off |                    0 |
| N/A   31C    P0             63W /  350W |       0MiB /  46068MiB |      4%      Default |
|                                         |                        |                  N/A |
+-----------------------------------------+------------------------+----------------------+

+-----------------------------------------------------------------------------------------+
| Processes:                                                                              |
|  GPU   GI   CI              PID   Type   Process name                        GPU Memory |
|        ID   ID                                                               Usage      |
|=========================================================================================|
|  No running processes found                                                             |
+-----------------------------------------------------------------------------------------+
```

Verify the container workload works
```bash
sudo ctr images pull nvcr.io/nvidia/k8s/cuda-sample:vectoradd-cuda12.5.0
sudo ctr run --rm --gpus 0 \
    nvcr.io/nvidia/k8s/cuda-sample:vectoradd-cuda12.5.0 \
    vectoradd
```

The output of the container should look like this
```bash
[Vector addition of 50000 elements]
Copy input data from the host memory to the CUDA device
CUDA kernel launch with 196 blocks of 256 threads
Copy output data from the CUDA device to the host memory
Test PASSED
Done
```

### Kubernetes usage

For Kubernetes usage, it is required to disable the driver and toolkit when installing the [NVIDIA GPU operator][nvidia-gpu-operator].
```bash
helm repo add nvidia https://helm.ngc.nvidia.com/nvidia
helm install --wait --generate-name \
    -n gpu-operator --create-namespace \
    nvidia/gpu-operator \
    --set driver.enabled=false \
    --set toolkit.enabled=false
```

[official-sysext]: https://www.flatcar.org/docs/latest/provisioning/sysext/#flatcar-release-extensions-official
[flatcar-sysext-bakery-nvidia-runtime]: https://github.com/flatcar/sysext-bakery/releases/tag/nvidia-runtime
[nvidia-gpu-operator]: https://github.com/NVIDIA/gpu-operator
