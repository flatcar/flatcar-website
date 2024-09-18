---
title: Use LVM on Flatcar Container Linux
linktitle: Using LVM
description: How to use LVM to extend a logical volume across multiple disks 
weight: 30
aliases:
- ../../os/lvm
- ../../clusters/management/lvm
---

LVM - Logical Volume Management - allows you to create logical volumes, for example to use multiple physical disks as
one volume. This allows you to make the full use of all attached disks.

Flatcar Linux has built-in support for LVM.
This guide covers create logical volumes using LVM and using them.


## Creating LVM

There are two main ways to do this: create everything manually or properly use an ignition config. We will first cover
the manual way to get a better grip of what's happening and then the proper way.

### Manual

You can find all volumes using the `lsblk` command. For exampe:

```shell

# lsblk
NAME    MAJ:MIN RM   SIZE RO TYPE  MOUNTPOINTS
loop3     7:3    0  68.3M  1 loop
loop4     7:4    0  39.3M  1 loop
loop5     7:5    0     4K  1 loop
sda       8:0    0 223.6G  0 disk
|-sda1    8:1    0   128M  0 part
|-sda2    8:2    0     2M  0 part
|-sda3    8:3    0     1G  0 part
| `-usr 254:0    0  1016M  1 crypt /usr
|-sda4    8:4    0     1G  0 part
|-sda6    8:6    0   128M  0 part  /oem
|-sda7    8:7    0    64M  0 part
`-sda9    8:9    0 221.3G  0 part  /
sdb       8:16   0 447.1G  0 disk
sdc       8:32   0 447.1G  0 disk
sdd       8:48   0 223.6G  0 disk

```

Now we know that we have `/dev/sda`, `/dev/sdb`, `/dev/sdc`, `/dev/sdd` available. However, we cannot use `/dev/sda` in
this scenario, but we can work with the others. 


```shell
# pvcreate /dev/sda /dev/sdb /dev/sdc /dev/sdd
  WARNING: Failed to connect to lvmetad. Falling back to device scanning.
  Device /dev/sda excluded by a filter.
  Physical volume "/dev/sdb" successfully created.
  Physical volume "/dev/sdc" successfully created.
  Physical volume "/dev/sdd" successfully created.
```

You can verify that everything worked with the following commands:

```shell
# pvs
  PV         VG Fmt  Attr PSize   PFree
  /dev/sdb      lvm2 ---  447.13g 447.13g
  /dev/sdc      lvm2 ---  447.13g 447.13g
  /dev/sdd      lvm2 ---  223.57g 223.57g
  
  # pvdisplay
  "/dev/sdd" is a new physical volume of "223.57 GiB"
  --- NEW Physical volume ---
  PV Name               /dev/sdd
  VG Name
  PV Size               223.57 GiB
  Allocatable           NO
  PE Size               0
  Total PE              0
  Free PE               0
  Allocated PE          0
  PV UUID               x0N0k2-5c6j-HlHZ-vuAX-s82V-Yx8v-Pi3rWa

  "/dev/sdc" is a new physical volume of "447.13 GiB"
  --- NEW Physical volume ---
  PV Name               /dev/sdc
  VG Name
  PV Size               447.13 GiB
  Allocatable           NO
  PE Size               0
  Total PE              0
  Free PE               0
  Allocated PE          0
  PV UUID               dRa71o-rYk9-gJKC-bJdC-tJVV-yarW-LHTwPu

  "/dev/sdb" is a new physical volume of "447.13 GiB"
  --- NEW Physical volume ---
  PV Name               /dev/sdb
  VG Name
  PV Size               447.13 GiB
  Allocatable           NO
  PE Size               0
  Total PE              0
  Free PE               0
  Allocated PE          0
  PV UUID               vu98O9-4UDD-TTGK-PvsY-g4bN-FeL4-lcqLy7

```

As you can see, you do not yet have a virtual group. You use the `vgcreate` command to create one and add you PVs.

You need to specify the name of the group and the volumes you want to add to it like so:

```shell
# vgcreate base-layer /dev/sdb /dev/sdc /dev/sdd
  Volume group "base-layer" successfully created

```


Now you can go ahead and create a logical volume. We recommend to name it according to its purpose as in this example:

```shell
# lvcreate -n vol_docker -l 100%FREE base-layer
 Logical volume "vol_docker" created.
```

You can verify that everything worked well by issuing the following command:

```shell
# lvdisplay
  --- Logical volume ---
  LV Path                /dev/base-layer/vol_docker
  LV Name                vol_docker
  VG Name                base-layer
  LV UUID                d0ne0u-zBZQ-29f5-rkd9-XnZv-0vhE-rGmLvA
  LV Write Access        read/write
  LV Creation host, time rrackow-test, 2024-09-18 06:42:09 +0000
  LV Status              available
  # open                 0
  LV Size                1.09 TiB
  Current LE             286163
  Segments               3
  Allocation             inherit
  Read ahead sectors     auto
  - currently set to     256
  Block device           254:1
```

As you can see we now have a total size the sum of the individual disk.

Next we need to use `mkfs` to create an `ext4` filesystem:

```shell
# mkfs.ext4 /dev/base-layer/vol_docker
mke2fs 1.47.0 (5-Feb-2023)
Discarding device blocks: done
Creating filesystem with 293030912 4k blocks and 73261056 inodes
Filesystem UUID: eed7e226-87f8-40e0-a49b-21eae4ef9620
Superblock backups stored on blocks:
        32768, 98304, 163840, 229376, 294912, 819200, 884736, 1605632, 2654208,
        4096000, 7962624, 11239424, 20480000, 23887872, 71663616, 78675968,
        102400000, 214990848

Allocating group tables: done
Writing inode tables: done
Creating journal (262144 blocks): done
Writing superblocks and filesystem accounting information: done
```


Now you can for example mount the volume for use with docker, by mounting it to `/var/lib/docker` like so:

```shell
# mkdir /var/lib/docker
# mount /dev/base-layer/vol_docker /var/lib/docker

```

### Ignition

If you're not familiar, you can write butane configs in yaml format and later transpile it into an ignition config
using the [Butane Config Transpiler].

In your ignition config you will need two units: on to create the volume group and one to mount the volume.
Additionally, you will also need a script that executes all the required commands.

We will start with the script. It basically packages everything from the manual part into a script like so:

```Bash
#!/bin/bash
set -euo pipefail


# Function to find all disks
find_volumes(){
  lsblk -d -o NAME,TYPE | awk '$2 == "disk" {print "/dev/" $1}'
}

disks=$(find_volumes)

# Create Physical Volumes
pvcreate "${disks}"

# Create Volume Group
vgcreate vg-root "${disks}"

# Create Logical Volume for data
lvcreate -n vol_root -l 100%FREE vg-root

# Format the data volume with ext4 filesystem
mkfs.ext4 /dev/vg-root/vol_root
```

As you can see, we use a function to list **all** available disks. If you don't want all disks, you need to adjust
accordingly. If you want to mount to a different place, e.g. `/var/lib/docker` instead of `/`, you need to adjust this
bit as well.

The next step is to create the unit file that executes the script:

```Bash
[Unit]
Description=LVM Setup
ConditionFirstBoot=yes
Before=local-fs-pre.target
[Service]
Type=oneshot
Restart=on-failure
RemainAfterExit=yes
ExecStart=/etc/systemd/multi-user.target/lvm.sh #This is the name and path of the file above
[Install]
WantedBy=multi-user.target
```

However, we also need to mount the volume we created:

```Bash
[Unit]
Description=LVM Mount
[Mount]
What=/dev/vg-root/vol_root
Where=/
Type=ext4
Options=defaults
[Install]
WantedBy=local-fs.target
```

Now we need to put it all together into a butane yaml:

```yaml
variant: flatcar
version: 1.0.0
systemd:
  units:
    - name: lvm-setup.service
      enabled: true
      contents: |
        [Unit]
        Description=LVM Setup
        ConditionFirstBoot=yes
        DefaultDependencies=no
        Before=local-fs-pre.target
        [Service]
        Type=oneshot
        Restart=on-failure
        RemainAfterExit=yes
        ExecStart=/etc/systemd/system/multi-user.target.wants/lvm.sh
        [Install]
        WantedBy=multi-user.target
    - name: var-lib-docker.mount
      enabled: true
      contents: |
        [Unit]
        Description=Mount LVM to docker dir
        After=lvm-setup.service
        [Mount]
        What=/dev/vg-docker/vol_docker
        Where=/var/lib/docker
        Type=ext4
        Options=defaults
        [Install]
        WantedBy=local-fs.target
    - name: docker.service
      dropins:
        - name: 10-wait-docker.conf
          contents: |
            [Unit]
            After=var-lib-docker.mount
            Requires=var-lib-docker.mount
storage:
  files:
    - path: /etc/systemd/system/multi-user.target.wants/lvm.sh
      mode: 0744
      contents:
        inline: |
          #!/bin/bash
          set -euo pipefail


          # Function to find all disks
          find_volumes(){
            lsblk -d -o NAME,TYPE | awk '$2 == "disk" {print "/dev/" $1}'
          }

          disks=$(find_volumes)

          # Create Physical Volumes
          pvcreate "${disks}"

          # Create Volume Group
          vgcreate vg-root "${disks}"

          # Create Logical Volume for data
          lvcreate -n vol_root -l 100%FREE vg-root

          # Format the data volume with ext4 filesystem
          mkfs.ext4 /dev/vg-root/vol_root
```


As mentioned before, we need to still transpile from a butane yaml to an ignition config like so:

```Bash
$ docker run --rm -i quay.io/coreos/butane:latest < lvm.yaml > ignition.json
```

You can verify your config with the following:

```Bash
$ cat ignition.json
{"ignition":{"version":"3.3.0"},"storage":{"files":[{"path":"/etc/systemd/system/multi-user.target.wants/lvm.sh","contents":{"compression":"gzip","source":"data:;base64,H4sIAAAAAAAC/3ySQY/TPhTE7+9TzN/Nn20lQrYrbqsiIdTdC6AVQkicKjd5bqy4doidLFW33x05rtosB47Om/mN38Sz/4qttsVW+po8B+TcO7S6ZSW1IaIZHnpbBu0sgoPStoI0BpX2jad43AzO9Hv288WRAOO3pkFeIXf4+vHL+u33n09rvEA+N7jJ7rBaQUSvwLHttA0QRcVDIZAtTzegE1HZsQy8aQc/XyAix6hVNp+GLQjovdwa3qSxEESAct0oh7bIxsE9KkcAoBXaIbGRH9IUdx/eLPGCXcct8l8Qvi9L9l71xhyQxJW4R6jZjpC/Q7PpMTHFKFQ6XtxZjrfisnZ4JY17zvDIIaJhtA9w6sw+V/sqKJtfW1lE66e0yFN98LqUBj9SLXRZMTtOAaeJJ0nx2Lm+pWF31g+7vHJlw90/nJ/dbhKWypZBkrn0ajE4szmDcoPl7e3/D9/W6yt+fFCu28u0evQj/VM861CDf4f3UNqwP/jAe9o3yr8bP47v5MIprkH0JwAA//+D2TD6wwIAAA=="},"mode":484}]},"systemd":{"units":[{"contents":"[Unit]\nDescription=LVM Setup\nConditionFirstBoot=yes\nBefore=local-fs-pre.target\n[Service]\nType=oneshot\nRestart=on-failure\nRemainAfterExit=yes\nExecStart=/etc/systemd/system/multi-user.target.wants/lvm.sh\n[Install]\nWantedBy=multi-user.target\n","enabled":true,"name":"lvm-setup.service"},{"contents":"[Unit]\nDescription=Mount LVM to docker dir\n[Mount]\nWhat=/dev/vg-docker/vol_docker\nWhere=/var/lib/docker\nType=ext4\nOptions=defaults\n[Install]\nAfter=lvm-setup.service\nWantedBy=local-fs.target\n","enabled":true,"name":"var-lib-docker.mount"},{"dropins":[{"contents":"[Unit]\nAfter=var-lib-docker.mount\nRequires=var-lib-docker.mount\n","name":"10-wait-docker.conf"}],"name":"docker.service"}]}}
```

Add this ignition config to your cloud provider of choice now as user-data and create the given instance.

[Butane Config Transpiler]: https://www.flatcar.org/docs/latest/provisioning/config-transpiler/
