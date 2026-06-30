---
title: Developer Guides
weight: 110
aliases:
  - /docs/latest/reference/developer-guides/
  - /docs/latest/reference/
  - ../os/developer-guides
---

This section is aimed at curious developers interested in building Flatcar Container Linux from source and/or in modifying the OS.
We provide a containerised SDK that allows you to extend Flatcar and to build your own OS images.
We also provide OEM functionality for cloud providers and similar use cases to customize Flatcar Container Linux to run within their environment.

- [Guide to building custom Flatcar images from source][mod-cl]
- [Vending production images / CI integration][production-images]
- [Building custom kernel modules][kernel-modules]
- [SDK tips and tricks][sdk-tips]
- [SDK build process][sdk-bootstrapping]
- [Disk layout][disk-layout]
- [Kola integration testing framework][mantle-utils]
- [Release guide][release-guide]

### APIs and troubleshooting guides for working with Flatcar Container Linux.

* [Developer guides][developer-guides]: Comprehensive guides on developing for Flatcar, working with the SDK, and on building and extending OS images.
* [Integrations][integrations]
* [Migrating from cloud-config to Container Linux Config][migrating-from-cloud-config]
* [Flatcar Supply Chain Security (SLSA and SPDX SBOM)][supply-chain-security] detailing security mechanisms employed at build / release time as well as at run-time to ensure validity of inputs processed and outputs shipped.


[sdk-tips]: sdk-tips-and-tricks
[disk-layout]: sdk-disk-partitions
[production-images]: sdk-building-production-images
[mod-cl]: sdk-modifying-flatcar
[kernel-modules]: kernel-modules
[sdk-bootstrapping]: sdk-bootstrapping
[mantle-utils]: https://github.com/flatcar/mantle/blob/flatcar-master/README.md#kola
[release-guide]: release-guide
