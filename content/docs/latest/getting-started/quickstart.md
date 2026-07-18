---
title: Quickstart
content_type: how-to
weight: 5
description: >
  Get up and running quickly with Flatcar Container Linux.
aliases:
  - /docs/latest/os/quickstart/
  - /docs/latest/quickstart/
  - /os/quickstart/
  - /quickstart/
---

This quickstart shows how to provision Flatcar Container Linux to run on a local QEMU virtual machine, and does not require a physical target machine or spare disk as needed for a bare metal installation. For bare metal provisioning, see [Installing to disk](../deploy/bare-metal/installing-to-disk/).

The provisioning in this quickstart defines a Flatcar configuration in Butane YAML, and then runs [Butane](../fb-provision/butane/) to transpile it into a JSON file for use by [Ignition](../fb-provision/ignition/boot-process) in the Flatcar boot process. The YAML defines a `systemd` service to start an NGINX container and uses the local Butane binary for transpilation. Running Butane via Docker or Podman on the host is also possible but is beyond the scope of this quickstart.

## Prerequisites

### Step 1: Install Butane

Install Butane from the [CoreOS Butane Releases](https://github.com/coreos/butane/releases). 

Verification: Run `butane --version` to confirm installation.

### Step 2: Configure SSH Keys

Create an SSH key pair to log in to Flatcar, as the `core` user, for this quickstart:

```bash
ssh-keygen -t ed25519 -a 100 -f ~/.ssh/flatcar -C "flatcar-quickstart"
cat ~/.ssh/flatcar.pub
```

Verification: Run `ls -l ~/.ssh/flatcar ~/.ssh/flatcar.pub` to show the public and private key files.

In [Provisioning Tasks](#provisioning-tasks), you will add the public key returned from `cat ~/.ssh/flatcar.pub` to the `ssh_authorized_keys` collection in the Butane YAML.

## Provisioning Tasks

The common workflow for Flatcar provisioning is to define your machine configuration in a Butane YAML file and transpile it into Ignition JSON for first boot. You can complete these steps before starting the deployment steps below.

### Step 1: Create the Butane YAML

Save the following Butane YAML file as `cl.yaml`. If you choose a different filename, replace `cl.yaml` accordingly in the commands below.

Before you save the file, replace `<YOUR_SSH_PUBLIC_KEY>` with the full output of `cat ~/.ssh/flatcar.pub` (single line, including the key type and comment). This setting ensures that you can SSH into the provisioned Flatcar host as `core`.

```yaml
variant: flatcar
version: 1.0.0
passwd:
  users:
    - name: core
      # Replace the placeholder below with the full contents of ~/.ssh/flatcar.pub (one line).
      ssh_authorized_keys:
        - <YOUR_SSH_PUBLIC_KEY>
systemd:
  units:
    - name: nginx.service
      enabled: true
      contents: |
        [Unit]
        Description=NGINX example
        After=docker.service
        Requires=docker.service
        [Service]
        TimeoutStartSec=0
        ExecStartPre=-/usr/bin/docker rm --force nginx1
        ExecStart=/usr/bin/docker run --name nginx1 --pull always --log-driver=journald --net host docker.io/nginx:1
        ExecStop=/usr/bin/docker stop nginx1
        Restart=always
        RestartSec=5s
        [Install]
        WantedBy=multi-user.target
```

### Step 2: Transpile YAML to Ignition JSON

Transpile `cl.yaml` into `ignition.json`:

```bash
butane --pretty --strict < cl.yaml > ignition.json
```

Verification: Run `ls ignition.json` to confirm the file exists in the current directory.

If you prefer, you can also use this JSON directly as `ignition.json`:

```json
{
  "ignition": {
    "version": "3.3.0"
  },
  "passwd": {
    "users": [
      {
        "name": "core",
        "sshAuthorizedKeys": [
          "ssh-ed25519 AAAA...REPLACE-WITH-YOUR-PUBLIC-KEY... flatcar-quickstart"
        ]
      }
    ]
  },
  "systemd": {
    "units": [
      {
        "contents": "[Unit]\nDescription=NGINX example\nAfter=docker.service\nRequires=docker.service\n[Service]\nTimeoutStartSec=0\nExecStartPre=-/usr/bin/docker rm --force nginx1\nExecStart=/usr/bin/docker run --name nginx1 --pull always --log-driver=journald --net host docker.io/nginx:1\nExecStop=/usr/bin/docker stop nginx1\nRestart=always\nRestartSec=5s\n[Install]\nWantedBy=multi-user.target\n",
        "enabled": true,
        "name": "nginx.service"
      }
    ]
  }
}
```

## Deployment

This quickstart deploys Flatcar in a QEMU virtual machine. QEMU itself runs on Linux, macOS, and Windows, but the commands below assume a POSIX shell environment (Linux/WSL, or macOS with `wget` installed).

### Step 1: Install QEMU

Install [QEMU](../deploy/virt-options/qemu), a generic and open-source machine emulator and virtualizer.

Verification: Run `command -v qemu-system-x86_64` (AMD64) or `command -v qemu-system-aarch64` (ARM64) to show any current installation.

### Step 2: Download Flatcar image

Use the image that matches your architecture. The AMD64 example below uses the Stable channel.

ARM64 QEMU artifacts are currently published in the Alpha channel, so if you are using ARM64, replace `flatcar_production_qemu.sh` with `flatcar_production_qemu_uefi.sh` and use the ARM64 image filenames from `alpha.release.flatcar-linux.net`.

**AMD64 image:**

```bash
wget https://stable.release.flatcar-linux.net/amd64-usr/current/flatcar_production_qemu.sh
chmod +x flatcar_production_qemu.sh
wget https://stable.release.flatcar-linux.net/amd64-usr/current/flatcar_production_qemu_image.img
```

Verification: Run `ls -lh flatcar_production_qemu.sh flatcar_production_qemu_image.img` to show both files.

**ARM64 image:**

```bash
wget https://alpha.release.flatcar-linux.net/arm64-usr/current/flatcar_production_qemu_uefi.sh
chmod +x flatcar_production_qemu_uefi.sh
wget https://alpha.release.flatcar-linux.net/arm64-usr/current/flatcar_production_qemu_uefi_image.img
wget https://alpha.release.flatcar-linux.net/arm64-usr/current/flatcar_production_qemu_uefi_efi_vars.qcow2
wget https://alpha.release.flatcar-linux.net/arm64-usr/current/flatcar_production_qemu_uefi_efi_code.qcow2
```

Verification: `ls -lh flatcar_production_qemu_uefi.sh flatcar_production_qemu_uefi_image.img flatcar_production_qemu_uefi_efi_vars.qcow2 flatcar_production_qemu_uefi_efi_code.qcow2` confirms the ARM64 script, image, and UEFI firmware files.

### Step 3: Create a fresh copy before booting

Rename the downloaded image file to have a `fresh` extension, and then use copies of that fresh file for every boot.

**AMD64:**

```bash
mv flatcar_production_qemu_image.img flatcar_production_qemu_image.img.fresh
cp flatcar_production_qemu_image.img.fresh flatcar_production_qemu_image.img
```

**ARM64 (UEFI) equivalent:**

```bash
mv flatcar_production_qemu_uefi_image.img flatcar_production_qemu_uefi_image.img.fresh
cp flatcar_production_qemu_uefi_image.img.fresh flatcar_production_qemu_uefi_image.img
```

### Step 4: Create the ignition JSON file

Complete the [Provisioning Tasks](#provisioning-tasks), then return here to apply the Ignition file for this environment.

### Step 5: Boot with a fresh copy

The next step is to boot the VM and make the Ignition configuration available to it. Provisioning only runs on first boot, so if you want an updated Ignition configuration to be applied, boot from a fresh copy of the image. You can repeat these combined steps as often as you want to test your Ignition changes.

**AMD64:**

```bash
cp flatcar_production_qemu_image.img.fresh flatcar_production_qemu_image.img
./flatcar_production_qemu.sh -i ignition.json
```

Verification: QEMU starts and you eventually see the Flatcar login prompt in the VM console.

{{<note>}}
Hosts other than macOS will see `qemu-system-x86_64: invalid accelerator hvf` followed by a message about falling back to another accelerator. `hvf` is a macOS-only accelerator, and QEMU will accommodate automatically and the VM will boot and run normally.
{{</note>}}
**ARM64 (UEFI):**

```bash
cp flatcar_production_qemu_uefi_image.img.fresh flatcar_production_qemu_uefi_image.img && ./flatcar_production_qemu_uefi.sh -i ignition.json
```

Verification: UEFI QEMU starts successfully and reaches the Flatcar login prompt.

### Step 6: Log in using SSH

In a new terminal, run the following command:

```bash
ssh -i ~/.ssh/flatcar -p 2222 core@127.0.0.1
```

#### Subsequent logins

If you are going to use this quickstart multiple times and you see a host key mismatch warning, remove the previous key for this local endpoint and connect again:

```bash
ssh-keygen -R "[127.0.0.1]:2222"
ssh -i ~/.ssh/flatcar -p 2222 core@127.0.0.1
```

If you still need a temporary workaround, you can use the following command; however, it disables SSH host key verification. Use it only for this local ephemeral VM quickstart on `127.0.0.1`, and not for production or remote hosts.

```bash
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i ~/.ssh/flatcar -p 2222 core@127.0.0.1
```

Verification: SSH login opens a shell as user `core`.

### Step 7: Verify NGINX is running

Run these commands in the VM shell (after logging in over SSH):

```bash
systemctl status nginx

docker ps --filter name=nginx1

curl http://localhost/
```

Verification: `systemctl status nginx` shows `active (running)`, `docker ps` lists the `nginx1` container with status `Up`, and `curl http://localhost/` returns the raw HTML of the default NGINX page.

### Step 8: Clean up

In the terminal that ran SSH, run `exit` to close the connection. Then close the QEMU VM app.

Optionally, remove the SSH keys and local files created for this quickstart:

```bash
# Only remove these if you created them for this quickstart.
rm -f ~/.ssh/flatcar ~/.ssh/flatcar.pub
rm -f cl.yaml ignition.json
```

