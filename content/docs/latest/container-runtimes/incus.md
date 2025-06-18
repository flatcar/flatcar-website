---
title: Incus
description: Operate Incus from Flatcar
weight: 11
---

While Flatcar proposes Containerd and Docker by default, [Incus][incus] can be used to run containers. The goal of this guide is not to re-write the Incus documentation but to give key aspects of Incus usage on Flatcar.

# Installing Incus

Incus is provided as an [official][official-sysext] Systemd sysext Flatcar extension. To install it automatically at boot:
```yaml
---
# config.yaml
# butane < config.yaml > config.json
variant: flatcar
version: 1.1.0
storage:
  files:
    - path: /etc/subuid
      append:
        - inline: |
            root:1065536:65536
    - path: /etc/subgid
      append:
        - inline: |
            root:1065536:65536
    - path: /etc/flatcar/enabled-sysext.conf
      contents:
        inline: |
          incus
```

Once the instance booted, `incus` command is available and `incus.{socket,service}` are started. Note: the `core` user is added by default to the `incus-admin` group.
```bash
core@localhost ~ $ systemd-sysext status
HIERARCHY EXTENSIONS    SINCE
/opt      none          -
/usr      flatcar-incus Fri 2025-05-16 08:43:36 UTC
core@localhost ~ $ incus --version
6.0.3
core@localhost ~ $ userdbctl groups-of-user core
USER GROUP
core docker
core docker
core incus-admin
core portage
core systemd-journal
core systemd-journal
core wheel
core wheel

8 memberships listed.
```

# Initialize Incus

Before using Incus, it must be initialized using one of those two ways:
* Via CLI - Ideal for testing and quick setups.
* Using a pre-seed file - Recommended for automation and repeatable deployments.

The CLI can output the pre-seed file at the end of the manual initialization. Once done, it is possible to use pre-seed file from Butane:
```yaml
---
# config.yaml
# butane < config.yaml > config.json
variant: flatcar
version: 1.1.0
storage:
  files:
    - path: /etc/subuid
      append:
        - inline: |
            root:1065536:65536
    - path: /etc/subgid
      append:
        - inline: |
            root:1065536:65536
    - path: /etc/flatcar/enabled-sysext.conf
      contents:
        inline: |
          incus
    - path: /etc/incus/pre-seed.yaml
      contents:
        inline: |
          config: {}
          networks:
          - config:
              ipv4.address: auto
              ipv6.address: auto
            description: ""
            name: incusbr0
            type: ""
            project: default
          storage_pools:
          - config:
              size: 5GiB
            description: ""
            name: default
            driver: btrfs
          profiles:
          - config: {}
            description: "Flatcar profile"
            devices:
              eth0:
                name: eth0
                network: incusbr0
                type: nic
              root:
                path: /
                pool: default
                type: disk
            name: default
          projects: []
          cluster: null
systemd:
  units:
    - name: incus-admin-init.service
      enabled: true
      contents: |
        [Unit]
        Description=incus admin init
        After=systemd-sysext.service
        Requires=systemd-sysext.service
        [Service]
        StandardInput=file:/etc/incus/pre-seed.yaml
        Type=oneshot
        RemainAfterExit=yes
        ExecStart=/usr/bin/incus admin init --preseed
        [Install]
        WantedBy=multi-user.target
```

# Using Incus

Once Incus is installed and initialized, Incus [documentation][documentation] can be consulted to learn how to operate containers.

```bash
core@localhost ~ $ incus launch images:ubuntu/22.04 ubuntu-01
Launching ubuntu-01
core@localhost ~ $ incus list
+-----------+---------+----------------------+------+-----------+-----------+
|   NAME    |  STATE  |         IPV4         | IPV6 |   TYPE    | SNAPSHOTS |
+-----------+---------+----------------------+------+-----------+-----------+
| ubuntu-01 | RUNNING | 10.126.29.162 (eth0) |      | CONTAINER | 0         |
+-----------+---------+----------------------+------+-----------+-----------+
core@localhost ~ $ incus exec ubuntu-01 cat /etc/os-release
PRETTY_NAME="Ubuntu 22.04.5 LTS"
NAME="Ubuntu"
VERSION_ID="22.04"
VERSION="22.04.5 LTS (Jammy Jellyfish)"
VERSION_CODENAME=jammy
ID=ubuntu
ID_LIKE=debian
HOME_URL="https://www.ubuntu.com/"
SUPPORT_URL="https://help.ubuntu.com/"
BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"
PRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy"
UBUNTU_CODENAME=jammy
```

# Using Incus and ZFS

[ZFS][zfs] is provided as a Systemd sysext Flatcar extension as well, it fits perfectly with Incus as a storage driver. This configuration can be used to deactivate Docker and Containerd and enable Incus runtime using ZFS storage.

```yaml
---
# config.yaml
# butane < config.yaml > config.json
variant: flatcar
version: 1.1.0
storage:
  files:
    - path: /etc/subuid
      append:
        - inline: |
            root:1065536:65536
    - path: /etc/subgid
      append:
        - inline: |
            root:1065536:65536
    - path: /etc/flatcar/enabled-sysext.conf
      contents:
        inline: |
          incus
          zfs
    - path: /etc/incus/pre-seed.yaml
      contents:
        inline: |
          config: {}
          networks:
          - config:
              ipv4.address: auto
              ipv6.address: auto
            description: ""
            name: incusbr0
            type: ""
            project: default
          storage_pools:
          - config:
              size: 5GiB
            description: "Incus ZFS pool"
            name: default
            driver: zfs
          profiles:
          - config: {}
            description: ""
            devices:
              eth0:
                name: eth0
                network: incusbr0
                type: nic
              root:
                path: /
                pool: default
                type: disk
            name: default
          projects: []
          cluster: null
  links:
    - path: /etc/extensions/docker-flatcar.raw
      target: /dev/null
      overwrite: true
    - path: /etc/extensions/containerd-flatcar.raw
      target: /dev/null
      overwrite: true
systemd:
  units:
    - name: incus-admin-init.service
      enabled: true
      contents: |
        [Unit]
        Description=incus admin init
        After=systemd-sysext.service
        Requires=systemd-sysext.service
        [Service]
        StandardInput=file:/etc/incus/pre-seed.yaml
        Type=oneshot
        RemainAfterExit=yes
        ExecStart=/usr/bin/incus admin init --preseed
        [Install]
        WantedBy=multi-user.target
```

Incus will now use ZFS pool to store images and containers:

```bash
core@localhost ~ $ incus storage list
+---------+--------+----------------+---------+---------+
|  NAME   | DRIVER |  DESCRIPTION   | USED BY |  STATE  |
+---------+--------+----------------+---------+---------+
| default | zfs    | Incus ZFS pool | 1       | CREATED |
+---------+--------+----------------+---------+---------+
core@localhost ~ $ zpool list
NAME      SIZE  ALLOC   FREE  CKPOINT  EXPANDSZ   FRAG    CAP  DEDUP    HEALTH  ALTROOT
default  4.50G   592K  4.50G        -         -     1%     0%  1.00x    ONLINE  -
```


[incus]: https://linuxcontainers.org/incus/
[documentation]: https://linuxcontainers.org/incus/docs/main/
[official-sysext]: https://www.flatcar.org/docs/latest/provisioning/sysext/#flatcar-release-extensions-official
[zfs]: ../setup/storage/zfs
