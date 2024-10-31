---
title: Hands on 1 - Discovering
linktitle: Hands on 1 - Discovering
weight: 2
---

The goal of this hands-on is to:

* Locally run a Flatcar instance
* Boot the instance and SSH into
* Run Nginx container on the instance

# Step-by-step

Create a working directory:

```bash
mkdir flatcar; cd flatcar
```

Get the qemu helper:

```bash
wget https://stable.release.flatcar-linux.net/amd64-usr/current/flatcar_production_qemu.sh
```

Get the latest stable release for qemu:

```bash
wget https://stable.release.flatcar-linux.net/amd64-usr/current/flatcar_production_qemu_image.img
```

Create a backup to always have a fresh image around:

```bash
mv flatcar_production_qemu_image.img flatcar_production_qemu_image.img.fresh
```

Make the qemu helper executable:

```bash
chmod +x flatcar_production_qemu.sh
```

Before starting, make sure you boot a fresh image:

```bash
cp -i --reflink=auto flatcar_production_qemu_image.img.fresh flatcar_production_qemu_image.img
```

Starts the flatcar image in console mode:

```bash
./flatcar_production_qemu.sh -- -display curses
```

**__NOTE__**: it's possible to connect to the instance via SSH:

```bash
$ cat ~/.ssh/config
Host flatcar
	User core
	StrictHostKeyChecking no
	UserKnownHostsFile /dev/null
	HostName 127.0.0.1
	Port 2222
$ ssh flatcar
```

Once on the instance, you can try things and run a docker image:

```bash
docker run --rm -p 80:80 -d nginx
```

Assert it works:

```bash
curl localhost
```

# Resources

* [Hands on 2](../../tutorial/hands-on-2/)
* [Startup Flatcar Container Linux ](../../installing/vms/qemu/#startup-flatcar-container-linux)

# Demo

* Video with timestamp: <https://youtu.be/woZlGiLsKp0?t=472>
* Asciinema: <https://asciinema.org/a/591438>
