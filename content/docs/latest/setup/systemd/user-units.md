---
title: User Units
linktitle: User Units
description: Systemd User Units
weight: 40
---

Flatcar Container Linux supports the use of systemd user units.  These are unit files located in a users home directory, managed by the user, and executed with their permission.

User units are stored in `~/.config/systemd/user/`.  When using Butane to configure these during provisioning you must create this entire path, level by level as demonstrated here.  This is adapated from [documentation for Fedora CoreOS](https://docs.fedoraproject.org/en-US/fedora-coreos/tutorial-user-systemd-unit-on-boot/).

```yaml
variant: flatcar
version: 1.0.0
storage:
  directories:
    # Path for $user's systemd units
    - path: /home/$user/.config
      mode: 0755
      user:
        name: $user
      group:
        name: $user
    - path: /home/$user/.config/systemd
      mode: 0755
      user:
        name: $user
      group:
        name: $user
    - path: /home/$user/.config/systemd/user
      mode: 0755
      user:
        name: $user
      group:
        name: $user

    # Path to manually enable $user's systemd units - these are links back to the unit file
    - path: /home/$user/.config/systemd/user/default.target.wants
      mode: 0755
      user:
        name: $user
      group:
        name: $user

    # Path for $user's podman quadlets
    - path: /home/$user/.config/containers/systemd
      mode: 0755
      user:
        name: $user
      group:
        name: $user
```

## Network Access

In some cases the network will not be online when the user units are executed.  This may happen when there is no network requiring component in the boot process.  For example, requiring a network mounted home directory would cause user units to execute after the network was online.  If you have no such requirements or wish to gurantee that the network is online before user units are excuted you can use the following systemd dropin to modify the `systemd-user-sessions.service` to run after the network is online.  This affects all users.

```yaml
variant: flatcar
version: 1.0.0
systemd:
  units:
    - name: systemd-user-sessions.service
      dropins:
        - name: users-after-network.conf
          contents: |
            [Unit]
            After=network-online.target
```
