+++
title = "Running Flatcar Container Linux in Microsoft Azure"
tags = ["how-to", "azure", "flatcar"]
topics = ["cloud-provider", "flatcar"]
authors = ["Chris Kuehl"]
description = "How to creating new Flatcar Container Linux instance on Azure and migrate from existing CoreOS installs"
draft = false
date = "2020-04-24T17:13:00+02:00"
postImage = "azure-sky-clouds.jpg"
+++

Recently, we showed how easy it is to [migrate from CoreOS Container Linux to Flatcar Container Linux](https://kinvolk.io/blog/2020/03/steps-to-migrate-from-coreos-to-flatcar-container-linux/). Today we’re going to build on that to show how to start instances of [Flatcar Container Linux](https://www.flatcar-linux.org/) on Azure and how to migrate existing Azure instances running CoreOS Container Linux.

_Note: Red Hat announced [CoreOS Container Linux will reach its end-of-life on May 26](https://coreos.com/os/eol/). Flatcar Container Linux is the only drop-in replacement going forward._

## Creating a Flatcar Container Linux instance on Azure

Let’s start by looking at how to create a new Flatcar Container Linux instance of Azure. Firstly, Azure instances must be created in a new resource group in a location of your choosing.

`az group create --name group-1 --location <location>`

Once that’s done we can deploy a new instance using the following commands.

 ```bash
$ az vm image list --all -p kinvolk -f flatcar -s stable  # Query the image name urn specifier
[
  {
    "offer": "flatcar-container-linux",
    "publisher": "kinvolk",
    "sku": "stable",
    "urn": "kinvolk:flatcar-container-linux:stable:2345.3.1",
    "version": "2345.3.1"
  }
]

$ az vm create --name node-1 --resource-group group-1 --admin-username core --custom-data "$(cat config.ign)" --image kinvolk:flatcar-container-linux:stable:2345.3.1
```

The above queries the Azure API for the image information. In this case, we’re looking for the stable channel and in this the version is 2345.3.1. We use the fetched information and the group name to run `az vm create` to launch our new instances.


## Migrating from CoreOS to Flatcar Container Linux

There are two basic ways to migrate from CoreOS Container Linux to Flatcar Container Linux. The first is to modify your deployment. The other way is to do an in place update of your instance using CoreOS’ built in update mechanism. Let’s look at both, below.


## Modifying your deployment to install Flatcar Container Linux

Changing your deployment is often a simple one-line change in your configuration. For example. If you have an existing CoreOS deployment script you likely only need to change the offer and publisher that you’ve seen above. For example, from the following CoreOS install command...

```bash
az vm create --name node-1 --resource-group group-1 --admin-username core --custom-data "$(cat config.ign)" --image CoreOS:CoreOS:Alpha:latest
```

...you only need to update the `--image` flag to `kinvolk:flatcar-container-linux:stable:2345.3.1`

There are some small naming differences you should be aware of. We provide a[ set of migration notes](https://docs.flatcar-linux.org/os/migrate-from-container-linux/) to help you with this.


## Updating directly into Flatcar Container Linux

You may be in a situation where updating directly into Flatcar Container Linux from an existing CoreOS Container Linux install works better for you. In this case, the process is also easy but different.

In this scenario, you want to change the update server that is being used and the corresponding signing keys to those used by Flatcar Container Linux.

We’ve captured the details in our[ guide to updating directly into Flatcar Container Linux](https://docs.flatcar-linux.org/os/update-from-container-linux/). In that guide you’ll find[ this handy script](https://docs.flatcar-linux.org/update-to-flatcar.sh) that automates the process.

In short, it does these five steps:

* fetch the new update-payload-key.pub and bind-mount it over the old one,
* configure the new update server URL,
* force an update by bind-mounting a dummy release file with version 0.0.0 over the old one,
* restart the update engine service
* trigger an update.

An example of using the script follows.

```bash
_# To be run on the node via SSH_
core@host ~ $ wget https://docs.flatcar-linux.org/update-to-flatcar.sh
core@host ~ $ chmod +x update-to-flatcar.sh
core@host ~ $ ./update-to-flatcar.sh
[…]
Done, please reboot now
core@host ~ $ sudo systemctl reboot
```

As Flatcar Container Linux uses the exact same update mechanisms as CoreOS Container Linux, rebooting the machine will have you in a Flatcar Container Linux environment, a familiar place for those coming from the CoreOS world.

As with the previous method, please heed the[ set of migration notes](https://docs.flatcar-linux.org/os/migrate-from-container-linux/) we provide.

If you’re starting from scratch or migrating to Flatcar Container Linux from CoreOS, we’ve hopefully given you what you need to get started. For further information about [running Flatcar in Azure](https://docs.flatcar-linux.org/os/booting-on-azure/) and using Flatcar Container Linux in production please consult the [documentation](https://docs.flatcar-linux.org/).

If you encounter problems, please let us know by[ filing an issue](https://github.com/flatcar-linux/Flatcar/issues). For inquiries about support, you can reach us at hello@kinvolk.io.
