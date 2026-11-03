---
title: Configuring nftables
linktitle: Configure nftables
description: Configuring a persistent nftables firewall ruleset.
weight: 70
---

Flatcar Container Linux ships [`nftables`][nftables], the successor to `iptables`, as its packet filtering framework. The `nft` command line tool and the `iptables`-to-`nftables` compatibility layer are both available, but no ruleset is applied out of the box. This page covers writing a basic ruleset, applying it on a running machine, and making it persist across reboots and updates.

## Writing a basic ruleset

The following ruleset accepts loopback and already-established traffic, allows incoming SSH and HTTPS, and drops everything else on input:

```text
table inet filter {
  chain input {
    type filter hook input priority 0; policy drop;
    iif lo accept
    ct state established,related accept
    tcp dport 22 accept
    tcp dport 443 accept
  }
  chain forward {
    type filter hook forward priority 0; policy drop;
  }
  chain output {
    type filter hook output priority 0; policy accept;
  }
}
```

Load it on a running machine with:

```bash
sudo nft -f /path/to/ruleset.nft
```

Check the active ruleset at any time with:

```bash
sudo nft list ruleset
```

## Persisting the ruleset

The `nftables-store` and `nftables-load` systemd units save and restore the ruleset from `/var/lib/nftables/rules-save`, a single file readable only by root. Check whether they are already enabled:

```bash
systemctl is-enabled nftables-load nftables-store
```

If they are not, enable them and write the ruleset to the file they use so it survives reboots and updates:

```bash
sudo systemctl enable nftables-load nftables-store
sudo nft -f /path/to/ruleset.nft
sudo nft list ruleset | sudo tee /var/lib/nftables/rules-save
```

To set this up declaratively with a [Butane Config][butane-configs], write the ruleset directly into `/var/lib/nftables/rules-save` and enable the same two units:

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /var/lib/nftables/rules-save
      mode: 0600
      contents:
        inline: |
          table inet filter {
            chain input {
              type filter hook input priority 0; policy drop;
              iif lo accept
              ct state established,related accept
              tcp dport 22 accept
              tcp dport 443 accept
            }
            chain forward {
              type filter hook forward priority 0; policy drop;
            }
            chain output {
              type filter hook output priority 0; policy accept;
            }
          }
systemd:
  units:
    - name: nftables-load.service
      enabled: true
    - name: nftables-store.service
      enabled: true
```

`nftables-store.service` overwrites `/var/lib/nftables/rules-save` with the live ruleset on shutdown, so any change made with `nft` on a running machine is picked up automatically at the next reboot without needing to update the Butane config.

## Adjusting the ruleset

To change the limits from the [Additional information section of the originating request][nftables-rate-limit-issue], for example rate-limiting new connections instead of dropping them outright, add a `limit` statement to the relevant rule:

```text
tcp dport 22 ct state new limit rate 10/minute accept
tcp dport 443 ct state new limit rate 60/minute accept
```

Reload the ruleset with `nft -f` after editing it, and update `/var/lib/nftables/rules-save` (or the Butane config) the same way as above so the change persists.

[nftables]: https://wiki.nftables.org/
[butane-configs]: ../../fb-provision/butane
[nftables-rate-limit-issue]: https://github.com/flatcar/Flatcar/issues/1333
