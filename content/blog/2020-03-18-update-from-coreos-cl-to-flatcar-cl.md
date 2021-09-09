+++
title = "Steps to Migrate from CoreOS to Flatcar Container Linux"
tags = ["coreos", "Linux", "flatcar"]
topics = ["Flatcar Container Linux", "Product"]
authors = ["Chris Kuehl", "Kai Lüke"]
description = "Steps to Migrate from CoreOS to Flatcar Container Linux to react on the CoreOS End of Life in May"
draft = false
date = "2020-03-18T17:00:00+01:00"
postImage = "flatcar-path.jpg"
+++

[Flatcar Container Linux](https://www.flatcar-linux.org/) is a drop-in replacement for CoreOS Container Linux. Thus, one should think that a migration should be an effortless task, and it is.

Since Red Hat announced that [CoreOS Container Linux will reach its end-of-life on May 26](https://coreos.com/os/eol/), we’ve seen a major uptick in the usage of Flatcar Container Linux. We’ve also had a number of questions about the migration process. This post looks to highlight how to migrate to Flatcar Container Linux in two ways; modifying your deployment to install Flatcar Container Linux, and updating directly from CoreOS Container Linux.


# Modifying your deployment to install Flatcar Container Linux

Changing your deployment is often a simple one-line change in your configuration. For example, if you’re deploying Flatcar Container Linux on AWS, then you may only require updating the AMI to deploy. If on bare-metal, it may just be a change of path to the images.

To make sure your migration goes seamlessly, you should be aware of some small naming differences which you might need to adjust for. We provide a [set of migration notes](https://docs.flatcar-linux.org/os/migrate-from-container-linux/) to help you with this.


# Updating directly into Flatcar Container Linux

You may be in a situation where updating directly into Flatcar Container Linux from an existing CoreOS Container Linux install works better for you. In this case, the process is also easy but different.

In this scenario, you want to change the update server that is being used and the corresponding signing keys to those used by Flatcar Container Linux.

We’ve captured the details in our [guide to updating directly into Flatcar Container Linux](https://docs.flatcar-linux.org/os/update-from-container-linux/). In that guide you’ll find [this handy script](https://docs.flatcar-linux.org/update-to-flatcar.sh) that automates the process.

In short, it does these five steps:

* fetch the new update-payload-key.pub and bind-mount it over the old one,
* configure the new update server URL,
* force an update by bind-mounting a dummy release file with version 0.0.0 over the old one,
* restart the update engine service
* trigger an update.

An example of using the script follows.

```bash
# To be run on the node via SSH
core@host ~ $ wget https://docs.flatcar-linux.org/update-to-flatcar.sh
core@host ~ $ chmod +x update-to-flatcar.sh
core@host ~ $ ./update-to-flatcar.sh
[…]
Done, please reboot now
core@host ~ $ sudo systemctl reboot
```

As Flatcar Container Linux uses the exact same update mechanisms as CoreOS Container Linux, rebooting the machine will have you in a Flatcar Container Linux environment, a familiar place for those coming from the CoreOS world.

As with the previous method, please heed the [set of migration notes](https://docs.flatcar-linux.org/os/migrate-from-container-linux/) we provide.


# That’s it

If you follow the simple steps above, your migration should go without a hitch. If you encounter problems, please let us know by [filing an issue](https://github.com/flatcar-linux/Flatcar/issues) or getting in touch at [hello@kinvolk.io](mailto:hello@kinvolk.io).
