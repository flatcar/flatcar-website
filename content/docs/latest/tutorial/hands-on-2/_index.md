---
title: Hands on 2 - Provisioning
linktitle: Hands on 2 - Provisioning
weight: 2
---

The goal of this hands-on is to:

* Provision a local Flatcar instance
* Write Butane configuration
* Generate the Ignition configuration
* Boot the instance with the config

This is what we've done in the previous hands-on but now it's done _as code_, we want to deploy an Nginx container serving a "hello world" static webpage. As a reminder, Ignition configuration is used to provision a Flatcar instance, it's a JSON file generated from a Butane YAML configuration.

# Step-by-step

Clone the tutorial repository and cd into it:

```bash
git clone https://github.com/flatcar/flatcar-tutorial ; cd flatcar-tutorial/hands-on-2
```

Open `./config.yaml`, find the TODO section, and add the following section:

```bash
storage:
  files:
    - path: /var/www/index.html
      contents:
        inline: Hello world
```

**__NOTE__**: More [Butane Config Examples](https://www.flatcar.org/docs/latest/provisioning/config-transpiler/examples/) and [Common Setup, Operations and Customization](https://www.flatcar.org/docs/latest/setup).

Transpile the Butane configuration (`config.yaml`) to Ignition configuration (`config.json`) - it is possible to use the Butane [binary](https://coreos.github.io/butane/getting-started/#standalone-binary) or the Docker image

```bash
docker run --rm -i quay.io/coreos/butane:latest < config.yaml > config.json
```

Use a fresh Flatcar image from the previous hands-on (or download again). NOTE: Ignition runs at first boot, it won't work if you reuse your the previously booted image, always decompress again each time you change your Ignition config.

```bash
cp -i --reflink=auto ../hands-on-1/flatcar_production_qemu_image.img.fresh flatcar_production_qemu_image.img
chmod +x flatcar_production_qemu.sh
```

Start the image with Ignition configuration (`-i ./config.json`)

```bash
./flatcar_production_qemu.sh -i ./config.json -- -display curses
```

Once on the instance, assert nginx works correctly:


```bash
curl localhost
```

or

```bash
systemctl status nginx.service
```

# Resources

* [Hands on 3](../../tutorial/hands-on-3/)
* [More Butane Config Examples](https://www.flatcar.org/docs/latest/provisioning/config-transpiler/examples/)
* [Common Setup, Operations and Customization](https://www.flatcar.org/docs/latest/setup)
* [More On Butane Config Transpiler](https://www.flatcar.org/docs/latest/provisioning/config-transpiler/)
* [Concepts, Configuration, and Provisioning](https://www.flatcar.org/docs/latest/installing/#concepts-configuration-and-provisioning)
* <https://coreos.github.io/butane/examples/>
* <https://coreos.github.io/ignition/rationale/>

# Demo

* Video with timestamp: <https://youtu.be/woZlGiLsKp0?t=676>
* Asciinema: <https://asciinema.org/a/591440>
