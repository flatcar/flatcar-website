---
title: Hands on 4 - Updating
linktitle: Hands on 4 - Updating
weight: 2
---

The goal of this hands-on is to:

* Leverage auto-update feature
* Boot an old version of Flatcar (`stable-3374.2.5` for example)
* Provision with ignition from [Hands on 2](2-provisioning)
* Control the update

Hint, two services are used:

**FIXME TODO**
* `update-engine.service`: to download the update from a [Nebraska release server](../../nebraska/)
* `locksmithd.service`: to handle the reboot strategy

# Step-by-step

Download a previous version of Flatcar and the qemu helper:

```bash
wget https://stable.release.flatcar-linux.net/amd64-usr/3602.2.0/flatcar_production_qemu_image.img
wget https://stable.release.flatcar-linux.net/amd64-usr/3602.2.0/flatcar_production_qemu.sh
chmod +x flatcar_production_qemu.sh
```

Boot the instance with the nginx Ignition from a previous lab:

```bash
./flatcar_production_qemu.sh -i ../hands-on-2/config.json -- -display curses
```

Assert that `locksmithd.service` and `update-engine.service` are up and running:

```bash
systemctl status update-engine.service locksmithd.service
```

Check the release number:

```bash
cat /etc/os-release
```

To accelerate the update, we can force it. 

**_NOTE_**: it's not required to do this in "real life" it's just to avoid waiting minutes before downloading the update!

```bash
update_engine_client -update
```

Once rebooted, check the release number:

```bash
cat /etc/os-release
```

Assert that nginx is still running:

```bash
curl localhost
```

# Resources

**FIXME TODO**
* [Update and reboot strategies](https://www.flatcar.org/docs/latest/setup/releases/update-strategies/)

# Demo

* Asciinema: <https://asciinema.org/a/591443>
* Video with timestamp: <https://youtu.be/woZlGiLsKp0?t=1762>
