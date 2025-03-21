---
content_type: reference
title: Flatcar Container Linux update.conf specification
linktitle: update.conf
description: Fields and Location of the Flatcar update configuration file.
weight: 100
aliases:
    - ../../os/update-conf
    - ../../clusters/management/update-conf
---

Flatcar Container Linux uses [`update_engine`][update_engine] to check and fetch new updates from the [Nebraska Update Service](../../nebraska).

## Location

The client-side configuration of these updates is stored in `/etc/flatcar/update.conf`.
(there is a legacy symlink of `/etc/coreos -> /etc/flatcar` for compatibility with third-party integrations).
This file is in the user writable partition by default.

Next order of client-side configurations that are checked are:

* `/usr/share/flatcar/update.conf`
  * Generated at build time of the image/payload build
  * will typically contain:
    * `SERVER=`
    * `GROUP=`
* `/usr/share/flatcar/release`
  * Generated at build time of the image/payload build
  * will typically contain:
    * `FLATCAR_RELEASE_VERSION=`
    * `FLATCAR_RELEASE_BOARD=`
    * `FLATCAR_RELEASE_APPID=`

## Fields

Default installs of Flatcar will likely not need custom settings, and an empty or non-existing `/etc/flatcar/update.conf` file is sufficient.

* `GROUP`
  * The channel/group this host will pull updates from
  * public channels will be: `stable`, `beta`, `alpha` - since this value is also part of the OS image under `/usr/share/flatcar/update.conf` you should only overwrite it if needed
  * Nebraska supports group aliases that can be used instead of UUIDs
* `SERVER`
  * The update server to reach for updates
  * default community server is: https://public.update.flatcar-linux.net/v1/update/
  * An invalid URL like `disabled` will effectively disable downloading of updates while still allowing update-engine to mark a booted partition as successful, with the `flatcar-update` command you can use this instead of masking `update-engine.service`
* `FLATCAR_RELEASE_VERSION`
  * The current version of this machine
* `FLATCAR_RELEASE_BOARD`
  * The board build is determined by the architecture of the machine
* `FLATCAR_RELEASE_APPID`
  * The Flatcar specific application ID
  * For Flatcar this is: `{e96281a6-d1af-4bde-9a0a-97b76e56dc57}`
* `PCR_POLICY_SERVER`
  * Server to receive the `POST`'ed TPM PCR Policy
* `DOWNLOAD_USER`
  * Authentication user for fetching the update payload
  * As the update server can redirect to a payload download that may require its own authentication
* `DOWNLOAD_PASSWORD`
  * Authentication password for fetching the update payload
  * As the update server can redirect to a payload download that may require its own authentication
* `MACHINE_ALIAS`
  * Optional human-friendly name for the machine in addition to the machine ID from `/etc/machine-id`, to be displayed in the update server UI, should be unique but this is not enforced, use quotes if it contains whitespace
  * Set this dynamically by running, e.g., `sudo sed -i "/MACHINE_ALIAS=.*/d" /etc/flatcar/update.conf ;  echo "MACHINE_ALIAS=$(hostname)" | sudo tee -a /etc/flatcar/update.conf` for the output of the `hostname` command (as with the other variables, restarting `update-engine.service` is not needed)

_(for future-proofing, calling `git grep GetConfValue\(\"` in the [`update_engine`][update_engine] repo)_

[update_engine]: https://github.com/flatcar/update_engine
