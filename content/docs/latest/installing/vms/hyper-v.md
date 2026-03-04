---
title: Running Flatcar Container Linux on Hyper-V
linktitle: Running on Hyper-V
weight: 30
---

_While we always welcome community contributions and fixes, please note that Hyper-V is not an officially supported platform at this time because the release tests don't run for it. (See the [platform overview](/#installing-flatcar).)_

These instructions will walk you through running Flatcar Container Linux on Hyper-V.

## Choose a channel

Flatcar Container Linux is designed to be updated automatically with different schedules per channel. You can [disable this feature][update-strategies], although we don't recommend it. Read the [release notes][release-notes] for specific features and bug fixes.

Hyper-V images are created only for AMD64 and come in two disk formats, VHD for Hyper-V VM Generation 1 and VHDX for both Hyper-V Generation 1 and 2 VMs.

Note: Hyper-V Generation 2 virtual machines need to have secure boot disabled, as the VHDX images are not signed.

How to download a VHDX image file:

```powershell
# VHDX image is available for download from the alpha version 3941.0.0
curl.exe --progress-bar -LO "https://alpha.release.flatcar-linux.net/amd64-usr/3941.0.0/flatcar_production_hyperv_vhdx_image.vhdx.zip"
Expand-Archive flatcar_production_hyperv_vhdx_image.vhdx.zip .
```

## Deploying a new virtual machine on Hyper-V using Ignition with autologin and TPM LUKS2 root partition encryption

```powershell
$vmName = "my_flatcar_01"
$vmDisk = "flatcar_production_hyperv_vhdx_image.vhdx"

New-VM -Name $vmName -MemoryStartupBytes 2GB `
    -BootDevice VHD -SwitchName "Default Switch" `
    -VHDPath (Resolve-Path $vmDisk) -Generation 2
Set-VMFirmware -EnableSecureBoot "Off" -VMName $vmName

# The core user password is set to foo

$ignitionMetadata = @'
variant: flatcar
version: 1.0.0
kernel_arguments:
  should_exist:
    - flatcar.autologin
passwd:
  users:
    - name: core
      password_hash: $6$sn3ZSJJJln5JkAZb$VDTKzLpCyjlEe7Kh0DKjOnEawkkOoi0tOKVbcCv0FIWSf3u9Y1p1I5YdJJ5L8uDmmMvO2CBlmJZNdxFuekjjE1
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
'@
echo $ignitionMetadata > ignition.yaml

# download the butane binary to create the raw ignition metadata
# https://github.com/coreos/butane/releases
curl.exe -sLO "https://github.com/coreos/butane/releases/download/v0.20.0/butane-x86_64-pc-windows-gnu.exe"

# transform the Ignition metadata from Butane format to Ignition raw
.\butane-x86_64-pc-windows-gnu.exe ".\ignition.yaml" -o ".\ignition.json"

# download the tool kvpctl to set the Ignition metadata from
# https://github.com/containers/libhvee/releases
# See: https://docs.fedoraproject.org/en-US/fedora-coreos/provisioning-hyperv/
curl.exe -sLO "https://github.com/containers/libhvee/releases/download/v0.7.1/kvpctl-amd64.exe.zip"
Expand-Archive kvpctl-amd64.exe.zip .
.\kvpctl-amd64.exe "$vmName" add-ign ignition.json

Set-VMKeyProtector -VMName $vmName -NewLocalKeyProtector
Enable-VMTPM -VMName $vmName

Start-VM -Name $vmName
```

A more complete TPM2 example can be found at [security-luks][security-luks].

At boot time, the Flatcar Container Linux will detect that the volume size has changed and will resize the filesystem accordingly.

Currently, there is no support for the Hyper-V guest to hypervisor communication, useful for virtual machine IP retrieval.

## Creating a config-drive for first boot configuration (Ignition alternative)

While Ignition is not supported on a config-drive, you can provide a Cloud-config following the coreos-cloudinit subset.

The cloud-config can be specified by attaching a [config-drive](https://github.com/flatcar/coreos-cloudinit/blob/master/Documentation/config-drive.md) with the label `config-2`. This is commonly done through whatever interface allows for attaching CD-ROMs or new drives.

Note that the config-drive standard was originally an OpenStack feature, which is why you'll see strings containing `openstack`. This filepath needs to be retained, although Flatcar Container Linux supports config-drive on all platforms.

For more information on customization that can be done with cloud-config, head on over to the [cloud-config guide](https://github.com/flatcar/coreos-cloudinit/blob/master/Documentation/cloud-config.md).

You need a config-drive to configure at least one SSH key to access the virtual machine. If you are in hurry, you can create a basic config-drive on Windows with following steps:

```powershell
#ps1
# mkisofs can be downloaded from https://github.com/cloudbase/cloudbase-init-test-resources/tree/master/bin
curl.exe -sLO "https://github.com/cloudbase/cloudbase-init-test-resources/blob/master/bin/mkisofs.exe"

# create an Openstack config drive folder structure
mkdir config-drive-metadata/openstack/latest
echo '{"hostname": "my_flatcar_01.local", "name": "my_flatcar_01", "public_keys": {"userkey": "INSERT_HERE_PUBLIC_SSH_KEY"}' > config-drive-metadata/openstack/latest/meta_data.json

# create the config drive
& "mkisofs.exe" -o "config-drive.iso" -ignore-error -ldots -allow-lowercase -allow-multidot -l -publisher "cbsl" -quiet -J -r -V "config-2" "config-drive-metadata"
```

An ISO file named `config-drive.iso` will be created that will configure a virtual machine to accept your SSH key and set its name to my_flatcar_01.

## Deploying a new virtual machine on Hyper-V using config drive

```powershell
$vmName = "my_flatcar_01"
$vmDisk = "flatcar_production_hyperv_vhdx_image.vhdx"

# For Generation 1 VM
New-VM -Name $vmName -MemoryStartupBytes 4GB `
    -BootDevice VHD -SwitchName "Default Switch" -VHDPath (Resolve-Path $vmDisk) -Generation 1

# For Generation 2 VM
New-VM -Name $vmName -MemoryStartupBytes 2GB `
    -BootDevice VHD -SwitchName "Default Switch" -VHDPath (Resolve-Path $vmDisk) -Generation 2
# Generation 2 VM needs to have secure boot disabled, as the images are not signed
Set-VMFirmware -EnableSecureBoot "Off" -VMName $vmName
Set-VM -AutomaticCheckpointsEnabled:$false -VMName $vmName
Set-VMProcessor -VMName $vmName -Count 4

# Now, add the config-drive file as DvdDrive
Add-VMDvdDrive -VMName $vmName -Path "config-drive.iso"

Start-VM -Name $vmName
```

## Using Flatcar Container Linux

Now that you have a machine booted it is time to play around. Check out the [Flatcar Container Linux Quickstart][quickstart] guide or dig into [more specific topics][doc-index].

[update-strategies]: ../../setup/releases/update-strategies
[security-luks]: ../../setup/security/luks
[release-notes]: https://flatcar-linux.org/releases
[quickstart]: ../
[doc-index]: ../../
