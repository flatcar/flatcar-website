---
title: Configuring the nftables firewall
linktitle: nftables firewall
description: Set up a basic nftables firewall for SSH and HTTPS, on a running node or at provisioning time with Butane.
weight: 50
---

Since [release 3510.2.0](https://www.flatcar.org/releases#release-3510.2.0) Flatcar Container Linux uses [nftables](https://wiki.nftables.org/) as its firewall backend (the `iptables` command remains available through the `iptables-nft` compatibility layer). Rules are loaded and saved by two systemd services shipped with the OS:

- `nftables-load.service` loads the ruleset from `/var/lib/nftables/rules-save` early at boot (before `network-pre.target`).
- `nftables-store.service` writes the currently active ruleset back to `/var/lib/nftables/rules-save` on shutdown.

Flatcar does not ship a default ruleset, so an unconfigured node does no host-level filtering and relies on your cloud or network security groups. Because `/var/lib/nftables/rules-save` lives on the writable, stateful `/var` partition, a ruleset placed there persists across both reboots and Flatcar updates.

> Applying a ruleset with a `drop` input policy over SSH can lock you out if the ruleset is wrong. Keep a console session (or your provider's web console) open while you test, and make sure the ruleset accepts your SSH port before you enable it.

## An example ruleset for SSH and HTTPS

The following ruleset sets a default-drop input policy, allows loopback and established traffic, and permits SSH (port 22) and HTTPS (port 443). New connections to those ports are rate-limited per source IP address, which slows down brute-force and connection-flood attempts. This is the nftables equivalent of the older iptables `recent` module.

```
#!/usr/sbin/nft -f

flush ruleset

table inet filter {
	chain input {
		type filter hook input priority filter; policy drop;

		# Allow loopback traffic.
		iif "lo" accept

		# Allow established/related connections; drop invalid packets.
		ct state established,related accept
		ct state invalid drop

		# Allow ICMP / ICMPv6 (ping and path-MTU discovery).
		ip protocol icmp accept
		ip6 nexthdr ipv6-icmp accept

		# SSH (22): drop new connections from a source IP that exceeds the rate,
		# then accept the rest.
		tcp dport 22 ct state new meter ssh_meter { ip saddr limit rate over 10/minute burst 5 packets } drop
		tcp dport 22 accept

		# HTTPS (443): rate-limit new connections per source IP.
		tcp dport 443 ct state new meter https_meter { ip saddr limit rate over 60/minute burst 20 packets } drop
		tcp dport 443 accept
	}

	chain forward {
		type filter hook forward priority filter; policy drop;
	}

	chain output {
		type filter hook output priority filter; policy accept;
	}
}
```

Adjust the ports, rates, and burst values to suit your workload. To also accept plain HTTP, add `tcp dport 80 accept`. The `meter` sets (`ssh_meter`, `https_meter`) track the rate per source address and expire idle entries automatically.

## Configuring nftables on a running node

Write the ruleset to `/var/lib/nftables/rules-save`, then enable the loader service:

```bash
# Place your ruleset (see above) at the path the loader reads.
sudo install -Dm600 rules-save /var/lib/nftables/rules-save

# Load it now and on every boot.
sudo systemctl enable --now nftables-load.service
```

`nftables-load.service` is a one-shot unit, so `--now` applies the rules immediately. After editing the file later, re-apply it with either of:

```bash
sudo systemctl restart nftables-load.service
# or, equivalently:
sudo nft -f /var/lib/nftables/rules-save
```

If you prefer to build the ruleset interactively with `nft add ...` commands, enable `nftables-store.service` as well so the live ruleset is written back to `/var/lib/nftables/rules-save` at shutdown:

```bash
sudo systemctl enable nftables-store.service
```

## Configuring nftables at provisioning time with Butane

To ship the firewall as part of a node's provisioning, deliver the ruleset file and enable `nftables-load.service` from a [Butane]({{< relref "../../fb-provision/butane" >}}) configuration. Ignition writes the file before systemd starts, so the service loads it on the first boot.

```yaml
variant: flatcar
version: 1.0.0
storage:
  files:
    - path: /var/lib/nftables/rules-save
      mode: 0600
      contents:
        inline: |
          #!/usr/sbin/nft -f

          flush ruleset

          table inet filter {
          	chain input {
          		type filter hook input priority filter; policy drop;

          		iif "lo" accept
          		ct state established,related accept
          		ct state invalid drop
          		ip protocol icmp accept
          		ip6 nexthdr ipv6-icmp accept

          		tcp dport 22 ct state new meter ssh_meter { ip saddr limit rate over 10/minute burst 5 packets } drop
          		tcp dport 22 accept

          		tcp dport 443 ct state new meter https_meter { ip saddr limit rate over 60/minute burst 20 packets } drop
          		tcp dport 443 accept
          	}
          	chain forward {
          		type filter hook forward priority filter; policy drop;
          	}
          	chain output {
          		type filter hook output priority filter; policy accept;
          	}
          }
systemd:
  units:
    - name: nftables-load.service
      enabled: true
```

Transpile the Butane config to Ignition with `butane` and pass the result to your provisioning method as usual.

## Inspecting and modifying the ruleset

Show the ruleset that is currently active in the kernel:

```bash
sudo nft list ruleset
```

To change the firewall, edit `/var/lib/nftables/rules-save` and re-apply it with `sudo systemctl restart nftables-load.service`. Because `nft -f` in the ruleset begins with `flush ruleset`, re-applying replaces the entire ruleset atomically rather than appending to it.

To raise the number of source addresses the rate-limiting sets can track on a busy server, give each `meter` an explicit `size`, for example:

```
tcp dport 22 ct state new meter ssh_meter size 65535 { ip saddr limit rate over 10/minute burst 5 packets } drop
```

## See also

- [nftables wiki](https://wiki.nftables.org/) for the full ruleset syntax.
- [Reading the system log](../../diagnostics/reading-the-system-log) to inspect `nftables-load.service` with `journalctl -u nftables-load.service` if the rules fail to load.
