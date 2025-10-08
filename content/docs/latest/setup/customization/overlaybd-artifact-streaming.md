---
title: OverlayBD Artifact Streaming
description: How to use and customize overlaybd and accelerated container image artifact streaming
weight: 30
---

### Installation

Flatcar Container Linux offers support for the installation and customization of containerd's [accelerated container image](https://containerd.github.io/overlaybd/#/) artifact streaming.
Both [`accelerated-container-image`](https://github.com/containerd/accelerated-container-image) and the [`overlaybd`](https://github.com/containerd/overlaybd/) back-end are combined in an optional, [system dependent sysext][official-sysext].

The sysext can be provisioned simply by adding the line `overlaybd` to `/etc/flatcar/enabled-sysext.conf`.
Since these sysexts are system dependent (compiled against the system's C library), they will be updated automatically in lockstep with the operating system.

Example Butane configuration:
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
        overlaybd
```

### Usage

The below usage largely follows upstream's [Getting started guide](https://github.com/containerd/accelerated-container-image/blob/main/docs/QUICKSTART.md).

The sysext includes upstream's [`overlaybd.json`](https://github.com/containerd/overlaybd/blob/main/src/example_config/overlaybd.json) and
[`config.json`](https://github.com/containerd/accelerated-container-image/blob/main/script/config.json) and will populate `/etc/overlaybd/` and `/etc/overlaybd-snapshotter/`
at extension merge time.

Containerd configuration needs to be [amended](https://github.com/containerd/accelerated-container-image/blob/main/docs/QUICKSTART.md#containerd) to use overlaybd and the snapshotter plugin.
Since Flatcar does not support containerd drop-in configuration at the time of writing, our Butane config needs to include the full containerd `toml`:
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
        overlaybd
    - path: /etc/containerd/config.toml
      contents:
        inline: |
          version = 2
          
          # persistent data location
          root = "/var/lib/containerd"
          # runtime state information
          state = "/run/containerd"
          # set containerd as a subreaper on linux when it is not running as PID 1
          subreaper = true
          # set containerd's OOM score
          oom_score = -999
          disabled_plugins = []
          
          # grpc configuration
          [grpc]
          address = "/run/containerd/containerd.sock"
          # socket uid
          uid = 0
          # socket gid
          gid = 0
          
          [plugins."io.containerd.runtime.v1.linux"]
          # shim binary name/path
          shim = "containerd-shim"
          # runtime binary name/path
          runtime = "runc"
          # do not use a shim when starting containers, saves on memory but
          # live restore is not supported
          no_shim = false
          
          [plugins."io.containerd.grpc.v1.cri"]
          # enable SELinux labeling
          enable_selinux = true
          
          [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
          # setting runc.options unsets parent settings
          runtime_type = "io.containerd.runc.v2"
          [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
          SystemdCgroup = true
          
          [proxy_plugins.overlaybd]
             type = "snapshot"
             address = "/run/overlaybd-snapshotter/overlaybd.sock"

systemd:
  units:
    - name: containerd.service
      dropins:
        - name: 10-configtoml.conf
          contents: |
            [Service]
            ExecStart=
            ExecStart=/usr/bin/containerd --config /etc/containerd/config.toml
```

After the instance provisioned successfully, accelerated container images can be started in accordance with [upstream's guilde](https://github.com/containerd/accelerated-container-image/blob/main/docs/QUICKSTART.md#run-overlaybd-images):
```bash
sudo /opt/overlaybd/snapshotter/ctr rpull -u {user}:{pass} registry.hub.docker.com/overlaybd/redis:6.2.1_obd
sudo ctr run --net-host --snapshotter=overlaybd --rm -t registry.hub.docker.com/overlaybd/redis:6.2.1_obd demo
```


[official-sysext]: https://www.flatcar.org/docs/latest/provisioning/sysext/#flatcar-release-extensions-official
