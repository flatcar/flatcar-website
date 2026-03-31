---
applyTo: "**"
---
# Flatcar Container Linux project conventions

## Project names
- Project names are proper nouns with an initial capital letter: Ignition, Dex, Matchbox.
- The Linux distribution is called **Flatcar Container Linux**.

## Specifics
- The singular possessive form of CoreOS is *CoreOS's*.
- Deployments occur *on-premises* (never "on-premise").
- Expand acronyms on first use, with the short form in parentheses: Trusted Platform Module (TPM).

## File name extensions
- YAML: use `.yaml` (not `.yml`)
- HTML: use `.html` (not `.htm`)

## File naming
- Use lower case, hyphen-separated names for files: `configuring-dns.md`, not `configuring_dns.md`.

## Hugo
- This is a Hugo site (Extended edition) using the `flatcar` theme.
- Documentation lives under `content/docs/latest/`.
- Blog posts live under `content/blog/`.
- Custom shortcodes are available: `note`, `warning`, `caution`, `tabs`, `tab`, `include`, `mermaid`, and others defined in `themes/flatcar/layouts/shortcodes/`.
