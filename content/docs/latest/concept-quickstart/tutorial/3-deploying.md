---
title: Hands on 3 - Deploying
linktitle: Hands on 3 - Deploying
weight: 2
---

The goal of this hands-on is to:

* Deploy Flatcar instances with IaC (Terraform)
* Manipulate Terraform code
* Write Flatcar provisioning with Terraform
* Deploy Flatcar on OpenStack with Terraform

This is a bundle of hands-on-1 and hands-on-2 but it's not a local deployment and _everything_ is as code.

# Step-by-step


Clone the tutorial repository and cd into it:

```bash
git clone https://github.com/flatcar/flatcar-tutorial; cd flatcar-tutorial/hands-on-3
```

Go into the terraform directory

```bash
cd terraform
```

Update the config for creating index.html from previous hands-on:

```bash
vim server-configs/server1.yaml
```

Initialize the terraform project locally:

```bash
terraform init
```

Get the credentials and update the `terraform.tfvars` consequently generate the plan and inspect it:

```bash
terraform plan
```

Apply the plan:

```bash
terraform apply
```

Go on the horizon dashboard and connect with terraform credentials find your instance.
One can assert that it works by accessing the console (click on the instance then "console").

_NOTE_: it's possible to SSH into the instance but at the moment, it takes a SSH jump through the openstack (devstack) instance.

```bash
ssh -J user@[DEVSTACK-IP] -i ./.ssh/provisioning_private_key.pem -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null core@[SERVER-IP]
```

In order to destroy the instance:

```bash
terraform destroy
```

# Resources

* [Hands on 4](4-updating)

**FIXME TODO**
* [Running Flatcar Container Linux on OpenStack](https://www.flatcar.org/docs/latest/installing/cloud/openstack/)
* <https://github.com/flatcar/flatcar-terraform/> (__NOTE__: the terraform code used here is based on this repository)

# Demo

* Video with timestamp: <https://youtu.be/woZlGiLsKp0?t=1395>
* Asciinema: <https://asciinema.org/a/591442>
