---
title: Running Flatcar Container Linux on Raspberry Pi 4
linktitle: Running on Raspberry Pi 4
weight: 10
---
### Hardware Requirements

- A Raspberry Pi 4
- Form of storage, either USB and/or SD card. USB 3.0 drive is recommended for the better performance in terms of price.
- Display (via micro HDMI/HDMI/Serial Cables)
- Keyboard

---


### Before we start
**A word of warning**:

- The UEFI firmware used in this guide is an [_UNOFFICIAL_ firmware](https://rpi4-uefi.dev/faq/#Is_this_an_official_Raspberry_Pi_Foundation_project), provided under an open source BSD license.
- Flatcar Container Linux support for Raspberry Pi is still in its early stages and is not thoroughly tested.
- Deploy Flatcar Container Linux on the hardware for purely fun and learning.
- Please follow the documentation at your own risk.

---

### Update the EEPROM
The Raspberry PI 4 uses an EEPROM to boot the system. Before proceeding ahead, it is recommended to update the EEPROM. Raspberry Pi OS automatically updates the bootloader on system boot. In case you are using Raspberry Pi OS already, then the bootloader may be already updated.

For manually updating the EEPROM, you can either use the Raspberry Pi Imager or the raspi-config. The former is the recommended method in the [Raspberry Pi documentation](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#raspberry-pi-4-boot-eeprom).

We will also see later how the RPi4 UEFI firmware needs a recent version of EEPROM.

#### Using the Raspberry Pi Imager (Recommended)

- Install the [Raspberry Pi Imager](https://www.raspberrypi.com/software/) software. You can also look for the software in your distribution repository.
- Launch `Raspberry Pi Imager`.
- Select `Misc utility images` under `Operating System`.
- Select `Bootloader`.
- Select the boot-mode, `SD`, `USB`
- Select the appropriate storage, `SD` or `USB`
- Boot the Raspberry Pi with the new image and wait for at least 10 seconds.
- The green activity LED will blink with a steady pattern and the HDMI display will be green on success.
- Power off the Raspberry Pi and disconnect the storage.

##### Using the raspi-config

- Update the `rpi-eeprom` package in the Raspberry Pi OS running.
```bash
sudo apt update
sudo apt full-upgrade
sudo apt install rpi-eeprom
```
- Run `sudo raspi-config`
- Select `Advanced Options`.
- Select `Bootloader Version`
- Select `Latest` for latest Stable Bootloader release.
- Reboot

##### Using the rpi-eeprom-update

- Update the `rpi-eeprom` package in the Raspberry Pi OS running.
```bash
sudo apt update
sudo apt full-upgrade
sudo apt install rpi-eeprom
```

- Check if there are available updates.
```bash
sudo rpi-eeprom-update
```

- Install the update
```bash
# The update is pulled from the `default` release channel.
# The other available channels are: latest and beta
# You can update the channel by updating the value of
# `FIRMWARE_RELEASE_STATUS` in the `/etc/default/rpi-eeprom-update`
# file. This is useful usually in case when you want
# features yet to be made available on the default channel.

# Install the update
sudo rpi-eeprom-update -a

# A reboot is needed to apply the update
# To cancel the update, you can use: sudo rpi-eeprom-update -r
sudo reboot
```

### Installing Flatcar

##### Install `flatcar-install` script

Flatcar provides a simple installer script that helps install Flatcar Container Linux on the target disk. The script is available on [Github](https://raw.githubusercontent.com/flatcar/init/flatcar-master/bin/flatcar-install), and the first step would be to install the script in the host system.

```bash
mkdir -p ~/.local/bin
# You may also add `PATH` export to your shell profile, i.e bashrc, zshrc etc.
export PATH=$PATH:$HOME/.local/bin

curl -LO https://raw.githubusercontent.com/flatcar/init/flatcar-master/bin/flatcar-install
chmod +x flatcar-install
mv flatcar-install ~/.local/bin
```

##### Set up Ignition config

Once the `flatcar-install` script has been installed, we can begin to write a Butane configuration file that can then be transpiled to Ignition.

[Why Butane](butane-transpiler)? The Butane configuration transpiler reads from an easier-to-write language (YAML), and parses it through to check for errors. This means that if you write a valid Butane configuration, and it successfully transpiles to JSON, you are guaranteed to have a valid Ignition configuration.

To generate your Ignition config, first start with the following `butane-config.yml`:

```yaml
variant: flatcar
version: 1.0.0
passwd:
  users:
    - name: core
      ssh_authorized_keys:
        - <paste authorized SSH keys here>


kernel_arguments:
  should_exist:
    - console=tty0 # Used to tell the Linux kernel to output console to its display adapter
  should_not_exist:
    - quiet # Show logs upon kernel boot
    - console=ttyAMA0,115200n8 # Disable the console being output via serial on the Raspberry Pi, so HATs can utilize that UART device.

storage:
  files:
    - path: /oem/grub.cfg
      contents:
        inline: set linux_console="console=tty0" # Create a grub.cfg that contains appropriate arguments for the linux command line. In this case, we are telling it to use tty0 for the console
      mode: 0644
      overwrite: true # There may be an existing file there, we want to overwrite it
      user:
        name: root
      group:
        name: root
  filesystems:
    - device: /dev/disk/by-label/OEM
      format: btrfs
      path: /oem
      label: OEM
```

To convert this to an Ignition config, simply run the following:

```bash
docker run --rm -i quay.io/coreos/butane:latest < butane-config.yml > ignition_config.json
```

This will generate an `ignition_config.json` file in your current directory.

##### Install Flatcar on the target device

Now that the `flatcar-install` script is installed in the host machine, and your Ignition config is generated, go ahead and install the Flatcar Container Linux image on the target device.
The target device could be a USB drive or SD Card.

The options that we will be using with the scripts are:
```bash
# -d DEVICE   Install Flatcar Container Linux to the given device.
# -C CHANNEL  Release channel to use
# -B BOARD    Flatcar Container Linux Board to use
# -o OEM      OEM type to install (e.g. ami), using flatcar_production_<OEM>_image.bin.bz2
# -i IGNITION Insert an Ignition config to be executed on boot.
```

- The device would be the target device that you would like to use. You can use the `lsblk` command to find the appropriate disk. For the example we would be using `/dev/sda`.
- With the given values of `channel` and `board`, the script would download the image, verify it with gpg, and then copy it bit for bit to disk.
- In our case, Flatcar does not yet ship Raspberry PI specific OEM images yet so the value will be an empty string `''`.
- Pass the Ignition file, `ignition_config.json` as was generated earlier, to provision the Pi during boot.

Go ahead with the write on the target device
```
sudo flatcar-install -d /dev/sda -C stable -B arm64-usr -o '' -i ignition_config.json
```

If you already have the image downloaded you can use the `-f` param to specify the path of the local image file.
```
sudo flatcar-install -d /dev/sda -C stable -B arm64-usr -o '' -i ignition_config.json -f flatcar_production_image.bin.bz2
```

##### Raspberry Pi 4 UEFI Firmware

[rpi-uefi community](https://rpi4-uefi.dev) ships a SBBR-compliant(UEFI+ACPI), ArmServerReady ARM64 firmware for Raspberry Pi 4. We will be using it to UEFI boot Flatcar.

`v1.17` of the [pftf/RPi4](https://github.com/pftf/RPi4/releases/tag/v1.17) introduced two major changes:
- Firstly, it enabled firmware boot directly from the USB. This is particularly helpful if you are using the installation process using a USB device.
- Secondly, support for directly placing the Pi boot files into the EFI System Partition (ESP). This feature was not implemented in the firmware, rather from the upstream firmware from Raspberry Pi Foundation. This is why it is recommended to update the Pi EEPROM at the very beginning.

Let's move ahead with the final steps.

- Place the UEFI firmware into the EFI System Partition.

```bash
# Note `/dev/sda` mentioned in the example needs to be the USB drive that
# we installed flatcar onto
efipartition=$(lsblk /dev/sda -oLABEL,PATH | awk '$1 == "EFI-SYSTEM" {print $2}')
mkdir /tmp/efipartition
sudo mount ${efipartition} /tmp/efipartition
pushd /tmp/efipartition
version=$(curl --silent "https://api.github.com/repos/pftf/RPi4/releases/latest" | jq -r .tag_name)
sudo curl -LO https://github.com/pftf/RPi4/releases/download/${version}/RPi4_UEFI_Firmware_${version}.zip
sudo unzip RPi4_UEFI_Firmware_${version}.zip
sudo rm RPi4_UEFI_Firmware_${version}.zip
popd
sudo umount /tmp/efipartition
```
- Remove the `USB`/`SD` from the host device and attach it into the Raspberry Pi 4 and boot.

In no time, your Raspberry Pi would boot and present you with a Flatcar Container Linux prompt.

### Caviats

#### ACPI mode prevents GPIO access

If the Pi is booted with ACPI mode set, this will cause it to be unable to access its GPIO pins, and as such, many HATs will not function. This is because the firmware does not boot when DeviceTree mode is selected.

This can be confirmed by hitting "Escape" once the Raspberry Pi logo appears on screen, then going to `Device Manager` --> `Raspberry Pi Configuration` --> `Advanced Configuration` --> `System Table Selection`, and confirming the mode is set to `ACPI`. Note that as of the time of this writing (mid-April, 2024), selecting DeviceTree causes the Pi to be unable to boot.


### Further Reading
- [rpi4-uefi.dev](https://rpi4-uefi.dev/) - RPi4 UEFI Firmware Official Website
- [Raspberry Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#raspberry-pi-4-boot-eeprom) documentation


[butane-transpiler]: ../../provisioning/config-transpiler/_index.md