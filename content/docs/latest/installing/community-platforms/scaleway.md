---
title: Running Flatcar on Scaleway
linktitle: Running on Scaleway
weight: 10
---

These instructions will walk you through using Flatcar on [Scaleway][scaleway], importing an image, and running your first server using the command line interface. Please note that Scaleway is a community supported platform at the moment which means that the CI does not run on Scaleway images.

## Import the image

_Note_: This getting started assumes that Scaleway and AWS CLI are already installed and properly configured.

It is possible to import your own Flatcar image in Scaleway using the [CLI][cli]. The process is done in two steps:
1. Upload Flatcar image on Scaleway S3 bucket
2. Create a snapshot from the S3 object

For example, to upload an image from the Flatcar Beta channel:

```bash
$ wget https://beta.release.flatcar-linux.net/amd64-usr/current/flatcar_production_scaleway_image.qcow2
$ aws s3api create-bucket --bucket flatcar
$ aws s3 cp flatcar_production_scaleway_image.qcow2 s3://flatcar/flatcar_production_scaleway_image.qcow2
$ SNAPSHOT_ID=$(scw instance snapshot create --wait \
  zone=fr-par-1 name=flatcar-beta volume-type=l_ssd \
  bucket=flatcar key=flatcar_production_scaleway_image.qcow2 | jq -r .id)
```

## Butane Configs

Flatcar allows you to configure machine parameters, launch systemd units on startup and more via Butane Configs. These configs are then transpiled into Ignition JSON configs and given to booting machines. Jump over to the [docs to learn about the supported features][butane-configs]. We're going to provide our Butane Config to Scaleway via the user-data flag. Our Butane Config will also contain SSH keys that will be used to connect to the instance.

As an example, this Butane YAML config will start an Nginx Docker container and display the instance hostname:

```yaml
variant: flatcar
version: 1.0.0
passwd:
  users:
    - name: core
      ssh_authorized_keys:
        - ssh-rsa ABCD...
storage:
  directories:
    - path: /var/www
systemd:
  units:
    - name: nginx.service
      enabled: true
      contents: |
        [Unit]
        Description=NGINX example
        After=docker.service coreos-metadata.service
        Requires=docker.service coreos-metadata.service
        [Service]
        EnvironmentFile=/run/metadata/flatcar
        TimeoutStartSec=0
        ExecStartPre=-/usr/bin/docker rm --force nginx1
        ExecStartPre=-/usr/bin/bash -c "echo 'Hello from ${COREOS_SCALEWAY_HOSTNAME}' > /var/www/index.html"
        ExecStart=/usr/bin/docker run --name nginx1 --volume "/var/www:/usr/share/nginx/html:ro" --pull always --log-driver=journald --net host docker.io/nginx:1
        ExecStop=/usr/bin/docker stop nginx1
        Restart=always
        RestartSec=5s
        [Install]
        WantedBy=multi-user.target
```

Transpile it to Ignition JSON:

```bash
cat butane.yaml | docker run --rm -i quay.io/coreos/butane:release > ignition.json
```

The `coreos-metadata.service` saves metadata variables to `/run/metadata/flatcar`. Systemd units can use them with `EnvironmentFile=/run/metadata/flatcar` in the `[Service]` section when setting `Requires=coreos-metadata.service` and `After=coreos-metadata.service` in the `[Unit]` section.

## Launch machine

Boot the machine with the CLI, referencing the snapshot ID from the import step above and your [Ignition file from Butane][butane-configs]:

```shell
$ INSTANCE_ID=$(scw instance server create image=none root-volume=l:"${SNAPSHOT_ID}" cloud-init=@./config.json --output=json | jq -r .id)
```

Your first Flatcar instance should now be running. The only thing left to do is find the IP address and SSH in.

```shell
$ IPV4=$(scw instance server get "${INSTANCE_ID}" --output json | jq -r .public_ip.address)
```

Finally SSH into an instance, note that the user is `core`:

```shell
$ curl "${IPV4}"
Hello from cli-srv-jovial-hamilton
$ ssh core@"${IPV4}"
Flatcar Container Linux by Kinvolk beta 3913.1.0 for Scaleway
core@cli-srv-jovial-hamilton ~ $ systemctl status nginx
● nginx.service - NGINX example
     Loaded: loaded (/etc/systemd/system/nginx.service; enabled; preset: enabled)
     Active: active (running) since Tue 2024-04-23 13:36:35 UTC; 3min 16s ago
    Process: 1560 ExecStartPre=/usr/bin/docker rm --force nginx1 (code=exited, status=0/SUCCESS)
```

## Using Flatcar Container Linux

Now that you have a machine booted it is time to play around. Check out the [Flatcar Container Linux Quickstart][quickstart] guide or dig into [more specific topics][doc-index].

Terraform examples are available here: https://github.com/flatcar/flatcar-terraform/tree/main/scaleway.

## Scaleway Kosmos

Kosmos is a Scaleway service that deploys a Kubernetes control plane on Scaleway and allows you to add nodes outside of Scaleway (other cloud providers, on-premise, etc.).
At this moment, the Scaleway Node Agent used to join the existing cluster is not open-source and does not yet support immutable OS. A request has been made to support OS where Kubeadm and Kubelet would be already available in the path.

[butane-configs]: ../../provisioning/config-transpiler
[cli]: https://github.com/scaleway/scaleway-cli
[doc-index]: ../../
[quickstart]: ../
[scaleway]: https://www.scaleway.com/
