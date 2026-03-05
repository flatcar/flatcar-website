---
title: "Flatcar Self-Paced Learning Series: Basic Operation and Local Testing"
linktitle: Basic Configuration and Testing
weight: 1
author: Lexi Nadolski, Thilo Fromm
---

Flatcar does only one thing: it runs container workloads.
You can’t install anything (no package manager), nor are you supposed to ever interact with the OS outside automation.

This session will set you up with Flatcar on your local machine and cover foundational basics.
Don't worry, we'll use a Flatcar VM - your host is safe.
Goal of this session is to create a foundation for all succeeding sessions in the series, and to provide a lightweight workflow to experiment and test configurations locally.
You do not need to have any experience with Flatcar, and you'll need only very little Linux experience.

## A note for infrastructure developers

All configuration included in this course can also be generated programmatically.
[Ignition](https://github.com/coreos/ignition) provides Go bindings for all Butane options used.

# Goals

In this first session, you will learn:

1. How to set up your system to run Flatcar locally in a VM.
2. How to start a Flatcar VM locally, in “no regrets” mode.
3. How to configure a basic service on Flatcar and connect to the service from your host.

# Flatcar Basic Operation and Local Testing

## Prerequisites

We will need a number of tools installed on your local laptop or workstation for this session.

* On Mac, please install `homebrew`
* On Windows, make sure [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install) is installed and a distribution is installed (the default Ubuntu will do fine).
* Linux is generally fine; you should be able to install everything using your distribution's package manager.

Using your  package manager, install:

* `docker` (**not** docker desktop. We need the command line docker and dockerd.)
* `qemu` (`qemu-system` on Ubuntu)
* `wget`

On Windows / WSL and Ubuntu it is necessary to add your local user to the "kvm" group so we can use hardware accelerated virtualisation.
You only need to do this once.
First, run

* `sudo usermod -a -G kvm <your-username>` . Note that the command might prompt you for your user password. Then, to apply the changes in the current session, run
* `newgrp kvm`.

Lastly:

* Make sure the docker background process (`dockerd`) is running. Homebrew on Mac should enable it by default. 
  * On Windows, set up [WSL to use systemd](https://devblogs.microsoft.com/commandline/systemd-support-is-now-available-in-wsl/)
  * Then run `sudo systemctl enable --now docker`
* You can test your set-up by running

  ```
  docker run --rm -ti alpine sh -c 'echo "Hello, World!"'
  ```
* You will need a pure text editor (i.e. not a document editor like word) to edit YAML files.
  You can of course also use IDEs or your favourite code editor as long as it doesn't break YAML files, or classic unix editors like `vim` or `ed`.
  [CodeEdit](https://www.codeedit.app) works nicely for Mac; plain Notepad will do on Windows.

## Create a work directory for this session

It is recommended you create an empty working directory to contain all downloads, scripts, and configuration concerning this and future sessions.
As a first step, we'll create a directory `flatcar` and change into that directory.

```bash
mkdir flatcar
cd flatcar
```

## Download the latest OS image

Before we can use Flatcar locally we will need to download an OS image.
You can find a list of all releases here: https://www.flatcar.org/releases/

For the purpose of this session we will use the latest Alpha release of Flatcar's QEMU image.
Don't worry - every Alpha release is thoroughly tested and must pass the same tests as Beta and Stable.

On Mac and on Linux systems running on ARM64 hardware you will need to download ARM64 images; on Windows/WSL and Linux on x86 hardware we'll use x86-64 images (or `amd64` in Flatcar lingo).

* The latest ARM64 Alpha release images are at https://alpha.release.flatcar-linux.net/arm64-usr/current/
* Amd64 images are at https://alpha.release.flatcar-linux.net/amd64-usr/current/

We need to download the following files:

* `flatcar_production_qemu_uefi.sh` which we also need to make executable
* `flatcar_production_qemu_uefi_efi_code.qcow2`
* `flatcar_production_qemu_uefi_efi_vars.qcow2`
* `flatcar_production_qemu_uefi_image.img`

```sh
# change this to 'amd64' for intel and AMD systems
arch="arm64"
wget https://alpha.release.flatcar-linux.net/"${arch}"-usr/current/{flatcar_production_qemu_uefi.sh,flatcar_production_qemu_uefi_efi_code.qcow2,flatcar_production_qemu_uefi_efi_vars.qcow2,flatcar_production_qemu_uefi_image.img}

chmod 755 flatcar_production_qemu_uefi.sh 
```

The download is about ~500MB so it might take some time.

## Start a local Flatcar VM

Now we’ll start the Flatcar VM for the first time.
We’ll use 2 important `qemu` command line options:

* `-nographic` will start the VM “headless”, without emulating graphics output.
  Flatcar is a server OS, we don’t need (or ship) graphics.
  Nicely enough, with that option qemu will now connect to the VM’s TTY (serial port) automatically and let us interact with the VM directly on the terminal we started it.
* `-snapshot` is the “No regrets” option.
  The disk image we downloaded will never be modified by qemu.
  Instead, changes are only temporary and will be lost when the VM is shut down.
  This helps us a lot with experimenting with Flatcar, as Flatcar configuration is only applied **at first boot**.

Start the VM with
```
./flatcar_production_qemu_uefi.sh -nographic -snapshot 
```

You'll see the VM boot, and after a short while you'll end up on a command prompt.
```
[   17.396816] mousedev: PS/2 mouse device common for all mice
[   17.405146] input: Power Button as /devices/LNXSYSTM:00/LNXPWRBN:00/input/input4
[   17.449715] ACPI: button: Power Button [PWRF]
[   17.659038] zram_generator::config[1580]: No configuration found.

[...]

localhost login: core (automatic login)

Flatcar Container Linux by Kinvolk alpha 4372.0.0 for QEMU
core@localhost ~ $
```

Note that you are automatically logged in as user `core`.
`core` is an unprivileged user, but has password-less `sudo` access.
You can switch to the `root` account at any time via
```
sudo -i
```

You can now interactively explore Flatcar and look around a bit.
E.g. create a file via
```
echo "hello" > /home/core/test.txt
```

The file will survive reboot
```
sudo reboot
```
...
```
cat /home/core/test.txt
hello
```

but not shutdown
```
sudo poweroff
```
...
```
./flatcar_production_qemu_uefi.sh -nographic -snapshot 
```
...
```
cat /home/core/test.txt
cat: /home/core/test.txt: No such file or directory
```

# Define a service to run on Flatcar

Flatcar nodes are configured declaratively in YAML (Butane [semantics](https://www.flatcar.org/docs/latest/provisioning/config-transpiler/configuration/)), transpiled to JSON, then passed to the VM at first start.
And since we’re using `-snapshot`, every start is the first start 😊

Provisioning configuration works in 2 stages:

1. **Butane YAML**: Written and maintained by humans.
   Transpiled to JSON which can be understood by the node provisioning agent **Ignition**.
2. **Ignition JSON**: Produced by transpiling Butane YAML or programmatically, via Ignition GO Bindings.
   Fed into the provisioning process as user data / custom data.
   Read and executed on by Ignition, the node provisioning agent, at very early boot.

For this section we’ll be following the [Flatcar quickstart guide](https://www.flatcar.org/docs/latest/installing/).
We'll define a simple web server service for Flatcar based on the NGINX docker container.

Using your favourite text editor, create a file `nginx.yaml` in the `flatcar` working directory.
Paste the following contents into the file, then save:

```yaml
variant: flatcar
version: 1.0.0
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

The configuration creates a simple systemd unit which starts the nginx container (in host networking mode) at system start.

Before we can use the configuration, we need to transpile the human-readable YAML format into machine readable JSON.
For this we'll run the Butane docker image on your local machine.
On a command line in the `flatcar` working directory where you created `nginx.yaml`, run

```
cat nginx.yaml | docker run --rm -i quay.io/coreos/butane:latest > nginx.json 
```

We have now created `nginx.json`, which we can feed to the VM starter script.

## Start Flatcar with the service configuration and test the service

Now we start the VM again, with 2 new changes:

- We’ll pass along `nginx.json` we just created to be used as the instance’s configuration
- We’ll forward the local machine’s port 12345 to the VM’s port 80, so we can connect to the VM’s NGINX from your machine.

```
./flatcar_production_qemu_uefi.sh -i nginx.json -f 12345:80 -- -nographic -snapshot
```
Did you note that an additional `--` snuck into our command line?
That's because we're using _script options_ for the first time.
These options (`-i nginx.json -f 12345:80`) go to the wrapper script `flatcar_production_qemu_uefi.sh`, while the others (`-nographic -snapshot`) are passed straight to `qemu`.
It's not required to use `--`, but it improves the command's readability and understandability.

The VM boots and after a short while you will be able to connect to [http://localhost:12345](http://localhost:12345) with a browser from your local machine and see the default NGINX web page.

In the VM, you can also run

* `docker ps` to see the nginx container running
* `sudo systemctl status nginx` to check the status of the NGINX systemd job
* `sudo journalctl -u nginx --no-pager -f` to see the nginx systemd unit's log output.
  You should see new log output when you refresh http://localhost:12345/ in your browser.

You can shut down your VM via `sudo shutdown now --poweroff`.

Feel free to experiment and extend your YAML configuration; [a few examples](https://www.flatcar.org/docs/latest/provisioning/config-transpiler/examples/) and the [full Butane specification](https://www.flatcar.org/docs/latest/provisioning/config-transpiler/configuration/) can be found in our documentation.

Because we're using `-snapshot`, you can apply provisioning configurations anew at every VM start.
You can iterate, experiment, and even make drastic changes to the node without serious consequences.

Don't forget to transpile before starting the VM so your changes apply!

# Connecting to the local VM using SSH

You might have noticed that sometimes, the Flatcar command line forces weird line breaks at 80 characters.
Also, some escape characters may break your typing flow sometimes.
The reason for that is we're connected via an emulated serial terminal (courtesy of `-nographic`), which has some restrictions.

We can overcome this by connecting to the VM via SSH _in a separate terminal window_.
Your SSH (public) keys from your `~/.ssh/`directory are automatically provisioned to the VM by our `flatcar_production_qemu_uefi.sh` wrapper script.
If you don't yet have SSH keys on your host, we'll generate these.
Check with
```
ls -la ~/.ssh/
```

if you see files like `id_rsa.pub`, `id_ecdsa.pub`, or `id_ed25519.pub`, you're all set.

If none of these are present, we'll generate an ED25519 key for you, no big deal:
```sh
ssh-keygen -t ed25519
```

You can use the default name (press enter at the prompt).
Since we're not going to use the key for anything serious, you don't need to set a passphrase either (though you may, if you want).

Your ssh public key(s) will be added to the `core` user's `authorized_keys` when the VM starts, allowing you to log in passwordless.

Now we can connect to the Flatcar VM via SSH.
If you generated keys above, restart the VM to make sure the new SSH keys are injected.
The wrapper script also helpfully creates a port-froward from the VM's (SSH) port 22 to host port 2222.

```sh
ssh -o "UserKnownHostsFile=/dev/null" -o "StrictHostKeyChecking=no" core@localhost -p 2222
```

The above command will not store the remote (VM) SSH fingerprint - this avoids fingerprint conflicts with new instances, as the fingerprints are generated on VM first boot (so basically on *every* boot).

Et voilà! You're now connected via SSH.
You can make it easier for yourself and add the rather cryptic SSH command line to your host's SSH client configuration at `~/.ssh/config`:

```ini
host flatcar-vm
  user core
  hostname localhost
  port 2222
  UserKnownHostsFile /dev/null
  StrictHostKeyChecking no
```

You can now connect comfortably by typing
```sh
ssh flatcar-vm
```

# Done!

In this session, you:

1. have set up your laptop or desktop to run Flatcar in a VM.
2. started Flatcar locally in "no regrets" mode.
3. Configure a basic service, provisioned it on Flatcar, and connected to the service from your host.
4. Connect to the Flatcar VM via SSH.

On a side note, the YAML and JSON files we used to define the service are vendor independent.
This means you could take `nginx.json` without changing it, pass it via user data or custom data to an AWS / Azure / GCP / OpenStack VM that uses the Flatcar image for provisioning, and you'd have a web server node.
