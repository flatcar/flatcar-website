+++
authors = ["mauricio-vasquez"]
date = "2021-04-22T10:00:00+02:00"
description = "Using eBPF in Flatcar Container Linux"
draft = false
tags = ["flatcar", "ebpf", "bpf", "security", "networking"]
title = "Using eBPF in Flatcar Container Linux"
postImage = "/ebpf-in-flatcar.jpg"
+++

Extended Berkeley Packet Filter (eBPF) is a core Linux technology with multiple
applications in different computer domains like security, networking and
tracing. For the containers and Kubernetes specific case, it’s used with
networking projects like Cilium or Calico, debugging solutions like BCC,
kubectl-trace and Inspektor Gadget, and security-related projects like tracee
and Falco.

eBPF is a very fast evolving technology: each new kernel release includes new
features, and different Linux distributions rush to enable them for their users.
Flatcar Container Linux is no exception, and in this blog post I cover the new
eBPF features that we have enabled in the lastest Flatcar versions and why they
are important.

Since Flatcar is an immutable OS, i.e the system partition is read only, we’ll
use [toolbox](https://github.com/kinvolk/toolbox/) to create a dev environment
where we can install the dependencies and tools we need without affecting the
host in some of the examples; in others we will use Docker.

## CONFIG_IKHEADERS

This option is used to expose the kernel headers through a kernel module. When
the module is loaded, it creates the `/sys/kernel/kheaders.tar.xz` file with the
kernel headers in a compressed format that can be uncompressed to a temporary
location to be used by the different tools when compiling eBPF programs. This
option is beneficial because it avoids installing the kernel headers on the host
and also having to share the system folder containing the headers with
containers.

This option is already available in the Flatcar Container Linux Stable release.

BCC [supports](https://github.com/iovisor/bcc/pull/2312) this feature, so it is
possible to run BCC tools without installing the kernel headers on the host when
the kernel is compiled with `CONFIG_IKHEADERS`. Let’s try it out!

In order to get a Flatcar instance running on your computer with qemu you can
follow the next steps. You can also get a running instance on any of the various
cloud providers that Flatcar supports.


```
$ wget https://stable.release.flatcar-linux.net/amd64-usr/current/flatcar_production_qemu_image.img.bz2
$ bzip2 -d flatcar_production_qemu_image.img.bz2
$ wget https://stable.release.flatcar-linux.net/amd64-usr/current/flatcar_production_qemu.sh
$ chmod +x flatcar_production_qemu.sh
$ ./flatcar_production_qemu.sh
```

Now, you can login in the VM with

```
$ ssh -o "UserKnownHostsFile=/dev/null" -o "StrictHostKeyChecking=no" -p 2222 core@localhost
Warning: Permanently added '[localhost]:2222' (ECDSA) to the list of known hosts.
Last login: Mon Apr 19 13:59:55 UTC 2021 from 10.0.2.2 on pts/1
Flatcar Container Linux by Kinvolk stable (2765.2.2)
core@localhost ~ $
```

Let’s check that the `IKHEADERS` config is actually set

```
core@localhost ~ $ zgrep CONFIG_IKHEADERS /proc/config.gz
CONFIG_IKHEADERS=m
```

Before creating the toolbox environment, let’s load the kheaders kernel module.
We do it that way to avoid having to mount the folders containing the kernel
modules into the toolbox environment we create below. If we mount the kernel
modules folder then this step is not needed and the BCC tool will load the
module automatically for us.

```
core@localhost ~ $ sudo modprobe kheaders
core@localhost ~ $ lsmod | grep -i kheaders
kheaders         	3674112  0
```

Now that we have the module loaded, we can create the toolbox environment. The
`/sys/kernel/debug` path has to be mounted into the toolbox container to allow
BCC to register and unregister kprobes. Please note that we aren’t sharing any
volume related to the kernel headers.

```
core@localhost ~ $ toolbox --bind=/sys/kernel/debug:/sys/kernel/debug
```

Install the bcc-tools package:

```
[root@localhost ~]# dnf install bcc-tools xz -y
```

Now, we can start using any of the tools provided by BCC. Let's try execsnoop, a
tool that monitors the exec syscall, i.e. creation of new processes. Execute
some commands in another terminal on the Flatcar host to see how they are traced
by the execsnoop tool.

```
[root@localhost ~]# /usr/share/bcc/tools/execsnoop
PCOMM        	PID	PPID   RET ARGS
ping         	2259   1233 	0 /usr/bin/ping 8.8.8.8
cat          	2260   1233 	0 /usr/bin/cat /dev/null
cat          	2261   1233 	0 /usr/bin/cat /etc/shadow
^C
```

We can then see how the tool is reporting the different processes that are
executed in the host. In this case the BCC tool didn’t load the kernel headers
from `/lib/modules/$(uname -r)/{source,build}/` but extracted them from
`/sys/kernel/kheaders.tar.xz` into a temporary directory and used them to
compile the eBPF code.

## CONFIG_DEBUG_INFO_BTF

This option generates [BPF Type Format
(BTF)](https://www.kernel.org/doc/html/latest/bpf/btf.html) information which
provides metadata about kernel internal structures. This option is fundamental
to use the [Compile Once - Run Everywhere
(CO-RE)](https://facebookmicrosites.github.io/bpf/blog/2020/02/19/bpf-portability-and-co-re.html)
mechanism that allows to run eBPF programs compiled in other kernel versions,
decreasing the time they require to be created as they are shipped pre-compiled
and it’s not required to compile them in the target machine.

This feature is also present in the Flatcar Container Linux Stable release. We
can follow the same steps as above to get an instance running:

```
$ wget https://stable.release.flatcar-linux.net/amd64-usr/current/flatcar_production_qemu_image.img.bz2
$ bzip2 -d flatcar_production_qemu_image.img.bz2
$ wget https://stable.release.flatcar-linux.net/amd64-usr/current/flatcar_production_qemu.sh
$ chmod +x flatcar_production_qemu.sh
$ ./flatcar_production_qemu.sh

$ ssh -o "UserKnownHostsFile=/dev/null" -o "StrictHostKeyChecking=no" -p 2222 core@localhost
Warning: Permanently added '[localhost]:2222' (ECDSA) to the list of known hosts.
Last login: Mon Apr 19 14:25:31 UTC 2021 on tty1
Flatcar Container Linux by Kinvolk stable (2765.2.2)
```

In order to try this feature we can use
[libbpf-tools](https://github.com/iovisor/bcc/tree/master/libbpf-tools), a set
of BCC-based tools that use libbpf and CO-RE, i.e. they are only compiled once.
These tools aren’t packaged for any distro yet, so we’ll need to compile them
from source. In this case I’ll compile the tools using Docker. If you don’t want
to go through this process, you can just use the `quay.io/kinvolk/libbpf-tools`
image we have prepared.

Let’s start by creating the container image with the libbpf-tools inside.

```
$ IMAGE=<repo/username/image:tag>
$ mkdir libbpf-tools-container && cd libbpf-tools-container
$ cat <<EOF > Dockerfile
FROM ubuntu:20.04 as builder

RUN set -ex; \
    export DEBIAN_FRONTEND=noninteractive; \
    apt-get update && \
    apt-get install -y build-essential pkg-config clang llvm libcap-dev libelf-dev git && \
    git clone https://github.com/iovisor/bcc/ -b v0.19.0 --recurse-submodules && \
    cd bcc/libbpf-tools/ && \
    make && mkdir /libbpf-tools && DESTDIR=/libbpf-tools prefix="" make install

FROM ubuntu:20.04
RUN set -ex; \
    export DEBIAN_FRONTEND=noninteractive; \
    apt-get update && \
    apt-get install -y libelf-dev
COPY --from=builder /libbpf-tools/bin /usr/bin
EOF
$ docker build . -t $IMAGE
# Push to registry if building on a different host
$ docker push $IMAGE
```

Now that we have a container image with our tools, we can start a container. It
has to be privileged in order to have the permissions needed to load and attach
eBPF programs. `/sys/kernel/debug` has to be shared, as above, to give BCC
access to kprobes. Let’s create the container, get an interactive terminal
and execute the execsnoop tool. While the execsnoop tool is running, open a
different ssh session to the Flatcar host and run some commands there, you’ll
see how they are traced.

```
$ docker run -it --privileged -v /sys/kernel/debug:/sys/kernel/debug $IMAGE
root@1d624982f6c9:/# execsnoop
PCOMM        	PID	PPID   RET ARGS
cat          	1867   1854 	0 /usr/bin/cat /dev/null
ping         	1868   1854 	0 /usr/bin/ping kinvolk.io
^C
```

## CONFIG_BPF_LSM

This option enables the [LSM BPF
programs](https://www.kernel.org/doc/html/latest/bpf/bpf_lsm.html) that are used
to instrument the LSM hooks.

This option is available in the Flatcar Container Linux Beta release and we
expect it to be part of Stable on Q2 2021. However, because of some performance
degradation the eBPF LSM hook is disabled by default. In order to enable it you
should boot the kernel with the `lsm=...,bpf` [command-line
parameter](https://www.kernel.org/doc/html/latest/admin-guide/kernel-parameters.html).

This is a pretty new feature in the Kernel and we’re not aware of many tools
using it. For instance, one use case is the systemd’s
[RestrictFileSystems](https://github.com/systemd/systemd/pull/18145) property.
You can get more details about that feature in our [Extending systemd Security
Features with
eBPF](https://kinvolk.io/blog/2021/04/extending-systemd-security-features-with-ebpf/)
blog post.

## What’s next

We are actively looking for new eBPF features in the Linux kernel that could be
relevant for our users. If there is any feature that we’re missing and you
consider it’s important, don’t hesitate to reach out and create a feature request
on our issue [tracker](https://github.com/kinvolk/Flatcar/issues/).
