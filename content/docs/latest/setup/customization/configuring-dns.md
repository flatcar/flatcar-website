---
title: DNS Configuration
description: How DNS resolution works and how to setup local DNS caching.
weight: 30
aliases:
    - ../../os/configuring-dns
    - ../../clusters/customization/configuring-dns
---

By default, DNS resolution on Flatcar Container Linux is handled through `/etc/resolv.conf`, which is a symlink to `/run/systemd/resolve/resolv.conf`. This file is managed by [systemd-resolved][systemd-resolved]. Normally, `systemd-resolved` gets DNS IP addresses from [systemd-networkd][systemd-networkd], either via DHCP or static configuration. DNS IP addresses can also be set via `systemd-resolved`'s [resolved.conf][resolved.conf]. See [Network configuration with networkd][networkd-config] for more information on `systemd-networkd`.

## Using a local DNS cache

`systemd-resolved` includes a caching DNS resolver. To use it for DNS resolution and caching, you must enable it via [nsswitch.conf][nsswitch.conf] by adding `resolve` to the `hosts` section.

Here is an example [Butane Config][butane-configs] snippet to do that:

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /etc/nsswitch.conf
      overwrite: true
      mode: 0644
      contents:
        inline: |
          # /etc/nsswitch.conf:

          passwd:      files usrfiles
          shadow:      files usrfiles
          group:       files usrfiles

          hosts:       files usrfiles resolve dns
          networks:    files usrfiles dns

          services:    files usrfiles
          protocols:   files usrfiles
          rpc:         files usrfiles

          ethers:      files
          netmasks:    files
          netgroup:    files
          bootparams:  files
          automount:   files
          aliases:     files
```

Only nss-aware applications can take advantage of the `systemd-resolved` cache. Notably, this means that statically linked Go programs and programs running within Docker/rkt will use `/etc/resolv.conf` only, and will not use the `systemd-resolve` cache.

To use `systemd-resolved` as the default DNS resolver for all applications on the host, switch to the `systemd-resolved` provided `stub-resolv.conf`:
 ```yaml
variant: flatcar
version: 1.0.0
storage:
  links:
    - path: /etc/resolv.conf
      overwrite: true
      target: /run/systemd/resolve/stub-resolv.conf
```
This is known to interfere with [Kubernetes][kubernetes] in certain situations.

## Special considerations regarding Multicast DNS (mDNS)

In some network environments, the reserved top level domain `.local` is used to identify internal devices.

This is in contradiction with [RFC 6762](https://datatracker.ietf.org/doc/html/rfc6762) but could be difficult to change across an entire environment.

Indeed, you will get `SERVFAIL` response from `resolved` when trying to resolve names ending with `.local`.

A simple workaround is to add `local` or `yourcompany.local` as a search domain in your network configuration. Here is an example with butane configuration:

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /etc/systemd/network/00-eth0.network
      contents:
        inline: |
          [Match]
          Name=eth0

          [Network]
          DNS=1.2.3.4
          Address=10.0.0.101/24
          Gateway=10.0.0.1
          Domains=yourcompany.local
```

[systemd-resolved]: http://www.freedesktop.org/software/systemd/man/systemd-resolved.service.html
[systemd-networkd]: http://www.freedesktop.org/software/systemd/man/systemd-networkd.service.html
[resolved.conf]: http://www.freedesktop.org/software/systemd/man/resolved.conf.html
[nsswitch.conf]: http://man7.org/linux/man-pages/man5/nsswitch.conf.5.html
[butane-configs]: ../../provisioning/config-transpiler
[networkd-config]: network-config-with-networkd
[kubernetes]: https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/#known-issues
