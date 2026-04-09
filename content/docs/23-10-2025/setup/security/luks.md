---
title: Setting up LUKS disk encryption
linktitle: Setting up LUKS disk encryption
description: Setting up LUKS disk encryption with automatic unlocking using systemd-cryptenroll or Clevis
weight: 10
---

Depending on where you run Flatcar Container Linux you might want to protect the data on disk against attackers that could pull out a hard disk or get access to a snapshot copy of it.
Like a laptop, a server can use disk encryption to protect the contents. However, since there is no-one to type the password for unlocking, the unlocking has to happen automatically. It's hard to do this in a secure way that also protects against attackers with prolonged physical access to the system or similar modification capabilities.

TPM2 chips provide a method to unlock automatically because they can store a secret inside them and only reveal the secret based on a policy. Even a simple policy that always reveals the secret provides protection against many simple attacks such as stealing an encrypted hard disk without the computer's mainboard, or getting access to a disk snapshot.
To prevent against attackers that can modify the system, the TPM policy must bind the secret against an exepected system state. Predicting this state is brittle and can lead to you either access yourself, or leaving a security hole open because the state did not capture all possible malicious modifications. A Linux system design that prevents against most malicious modifications without being too brittle is still a current development topic.

TPM2-backed rootfs encryption in Flatcar is supported from version 3913.0.1 onwards. You can try it out with the `./flatcar_production_pxe.sh` Flatcar Qemu script through the `-T TPMSTATEDIR` flag.

## Current limitations

Flatcar Container Linux uses GRUB as bootloader which, on UEFI systems, can measure the system state based on the configuration code it executes. This means that the TPM PCR values would not be predictable/universal for a given Flatcar version but would have to be observed locally. Flatcar's use of the kernel cmdline for various OEM configurations and for triggering Ignition adds to that.

This means that binding a secret against the full TPM PCR state only works realible when auto updates are disabled and when the first-boot setup is not involved, i.e., on the second boot. Also note that, as of now, Flatcar OEM extensions are also read from the OEM partition without creating measurements nor with pre-checking their checksum because the dm-verity protection policy for extension images is not flexible enough to allow users to also load unsigned extensions.

## Simple disk encryption

A simple way of protecting against limited attacks is to use the TPM as device-only secret store. A similar but slightly weaker security level can be achieved with a network secret store, such as [Tang][tang], that only works in the local network.

Flatcar supports systemd-cryptenroll for TPM and Clevis for TPM or Tang secrets. The root disk and/or additional disks can be encrypted. Ignition/Butane has inbuilt Clevis support while for systemd-cryptenroll a helper service is needed as of now.

By default systemd-cryptenroll will bind to PCR 7 which is the device firmware state. This is probably not so brittle but doesn't offer much protection anyway and can be disabled by explicitly setting an empty parameter value through `--tpm2-pcrs=` if it might cause disruption.

Example for TPM2-backed rootfs encryption with systemd-cryptenroll (Butane YAML):

```yaml
variant: flatcar
version: 1.0.0
storage:
  luks:
    - name: rootencrypted
      wipe_volume: true
      device: "/dev/disk/by-partlabel/ROOT"
  filesystems:
    - device: /dev/mapper/rootencrypted
      format: ext4
      label: ROOT
systemd:
  units:
    - name: cryptenroll-helper.service
      enabled: true
      contents: |
        [Unit]
        ConditionFirstBoot=true
        OnFailure=emergency.target
        OnFailureJobMode=isolate
        [Service]
        Type=oneshot
        RemainAfterExit=yes
        ExecStart=systemd-cryptenroll --tpm2-device=auto --unlock-key-file=/etc/luks/rootencrypted --wipe-slot=0 --tpm2-pcrs= /dev/disk/by-partlabel/ROOT
        ExecStart=rm /etc/luks/rootencrypted
        [Install]
        WantedBy=multi-user.target
```

For Clevis one needs a Butane version with support for the Flatcar 1.2 Butane spec (here using a dev version built from a [PR](https://github.com/coreos/butane/pull/523)).
Example for TPM2-backed rootfs encryption with Clevis:

```yaml
variant: flatcar
version: 1.2.0-experimental
storage:
  luks:
    - name: rootencrypted
      wipe_volume: true
      device: "/dev/disk/by-partlabel/ROOT"
      clevis:
        tpm2: true
  filesystems:
    - device: /dev/mapper/rootencrypted
      format: ext4
      label: ROOT
```

Clevis can also use a Tang server as secret store (Butane YAML):

```yaml
variant: flatcar
version: 1.2.0-experimental
kernel_arguments:
  should_exist:
    - rd.networkd=1
storage:
  luks:
    - name: rootencrypted
      device: "/dev/disk/by-partlabel/ROOT"
      clevis:
        tang:
          - url: "http://tang.mycompany.com"
            thumbprint: "Hk1VN2eKhzaVqWhXtXxXIGF5LRZt4cBWWb07I1-a0NX"
```

## A more secure setup for disk encryption

When disabling auto-updates and doing one additional reboot to get rid of the Ignition kernel cmdline parameter before binding against PCRs, one can use instruct GRUB to measure the kernel and boot code when using UEFI (PCR 8+9, note that the PCR values are not set on BIOS), and tell systemd-cryptenroll to bind against more than PCR 7. There are still limitations to the achieved protection because of the mentioned lack of extension signing on the OEM partition. Other issues may also reduce the security as this is an active area of development. The GRUB PCR values will be set after first boot, but that is ok because the first boot values are special and we can't bind against them.

**WARNING:** The way PCR values are used is not yet ideal and you might easily get locked out if you don't enroll a passphrase with `systemd-cryptenroll` or back up the recovery key available under `/etc/luks/`. Consider this approach experimental and understand that this protection has holes.

Example for TPM2-backed rootfs encryption with systemd-cryptenroll and stronger PCR binding (requires UEFI), including disabling updates (Butane YAML):

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /etc/flatcar/update.conf
      overwrite: true
      contents:
        inline: |
          SERVER=disabled
  luks:
    - name: rootencrypted
      wipe_volume: true
      device: "/dev/disk/by-partlabel/ROOT"
  filesystems:
    - device: /dev/mapper/rootencrypted
      format: ext4
      label: ROOT
systemd:
  units:
    - name: cryptenroll-helper-first.service
      enabled: true
      contents: |
        [Unit]
        ConditionFirstBoot=true
        OnFailure=emergency.target
        OnFailureJobMode=isolate
        After=first-boot-complete.target multi-user.target
        [Service]
        Type=oneshot
        RemainAfterExit=yes
        ExecStart=systemd-cryptenroll --tpm2-device=auto --unlock-key-file=/etc/luks/rootencrypted --tpm2-pcrs= /dev/disk/by-partlabel/ROOT
        ExecStart=mv /etc/luks/rootencrypted /etc/luks/rootencrypted-bind
        ExecStart=sleep 10
        ExecStart=systemctl reboot
        [Install]
        WantedBy=multi-user.target
    - name: cryptenroll-helper-bind.service
      enabled: true
      contents: |
        [Unit]
        ConditionFirstBoot=false
        ConditionPathExists=/etc/luks/rootencrypted-bind
        OnFailure=emergency.target
        OnFailureJobMode=isolate
        [Service]
        Type=oneshot
        RemainAfterExit=yes
        ExecStart=systemd-cryptenroll --tpm2-device=auto --unlock-key-file=/etc/luks/rootencrypted-bind --tpm2-pcrs=4+7+8+9+11+12+13 --wipe-slot=tpm2 /dev/disk/by-partlabel/ROOT
        ExecStart=mv /etc/luks/rootencrypted-bind /etc/luks/rootencrypted
        [Install]
        WantedBy=multi-user.target
```

Since we normally want updates you have to prevent locking yourself out by removing the PCR binding before updating and add it back after two reboots. The following example shows how to automate this with a helper that runs systemd-cryptenroll as post-update hook.

**WARNING:** Same as above but there might be even more corner cases to run into regarding locking yourself out. While it tries to be more secure by having an up-to-date system the below approach has more holes in the protection it offers due to the removal of the PCR binding when updates are due.

Example for TPM2-backed rootfs encryption with systemd-cryptenroll and stronger PCR binding (requires UEFI), with a added unbinding while the update reboot is pending (Butane YAML):

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /oem/bin/oem-postinst
      overwrite: true
      mode: 0755
      contents:
        inline: |
          #!/bin/bash
          set -euo pipefail
          # When the update fails to correctly apply, this runs again
          if [ -e /etc/luks/rootencrypted-bound ]; then
            mv /etc/luks/rootencrypted-bound /etc/luks/rootencrypted-bind
          fi
          # But since a reboot inbetween could have bound it again,
          # remove the PCR binding for every run
          systemd-cryptenroll --tpm2-device=auto --unlock-key-file=/etc/luks/rootencrypted-bind --wipe-slot=tpm2 --tpm2-pcrs= /dev/disk/by-partlabel/ROOT
  luks:
    - name: rootencrypted
      wipe_volume: true
      device: "/dev/disk/by-partlabel/ROOT"
  filesystems:
    - device: /dev/mapper/rootencrypted
      format: ext4
      label: ROOT
systemd:
  units:
    - name: cryptenroll-helper-first.service
      enabled: true
      contents: |
        [Unit]
        ConditionFirstBoot=true
        OnFailure=emergency.target
        OnFailureJobMode=isolate
        After=first-boot-complete.target multi-user.target
        [Service]
        Type=oneshot
        RemainAfterExit=yes
        ExecStart=systemd-cryptenroll --tpm2-device=auto --unlock-key-file=/etc/luks/rootencrypted --tpm2-pcrs= /dev/disk/by-partlabel/ROOT
        ExecStart=mv /etc/luks/rootencrypted /etc/luks/rootencrypted-bind
        ExecStart=sleep 10
        ExecStart=systemctl reboot
        [Install]
        WantedBy=multi-user.target
    - name: cryptenroll-helper-bind.service
      enabled: true
      contents: |
        [Unit]
        ConditionFirstBoot=false
        ConditionPathExists=/etc/luks/rootencrypted-bind
        OnFailure=emergency.target
        OnFailureJobMode=isolate
        Before=update-engine.service
        [Service]
        Type=oneshot
        RemainAfterExit=yes
        ExecStart=systemd-cryptenroll --tpm2-device=auto --unlock-key-file=/etc/luks/rootencrypted-bind --tpm2-pcrs=4+7+8+9+11+12+13 --wipe-slot=tpm2 /dev/disk/by-partlabel/ROOT
        ExecStart=mv /etc/luks/rootencrypted-bind /etc/luks/rootencrypted-bound
        [Install]
        WantedBy=multi-user.target
```

For debugging PCR value changes you can use `tpm2_pcrread` or `/usr/lib/systemd/systemd-pcrlock log`. Accessing single PCR values also works with `cat /sys/class/tpm/tpm0/pcr-sha256/NUMBER`.
You can test the above with `./flatcar_production_qemu_uefi.sh -i IGNITIONFILE -T swtpm-dir/` (UEFI is required).

We hope to soon reduce the use of kernel parameters in Flatcar to make PCR binding more simple - but the limitation that the first boot is different might stay (unless Ignition would already issue the reboot in `ignition-quench.service` after it fully configured the system).
In the future we hope to provide a Flatcar variant that can make use of systemd-boot for signed TPM policies that will allow to do auto updates and rollbacks without required re-enrollment, and make it possible to use systemd-pcrlock for additional control.

[tang]: https://github.com/latchset/tang
