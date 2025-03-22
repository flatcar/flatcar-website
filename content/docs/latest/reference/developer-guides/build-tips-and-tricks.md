---
title: Build Tips and Tricks for Flatcar
weight: 10
aliases: 
    - ../../os/build-tips-and-tricks
---

## Building Flatcar Efficiently

Flatcar is a Gentoo derivative, source-based operating system. Its immutability means that all packages must be built to create a production image. Here's how to achieve the fastest and most energy-efficient builds:

#### Current Situation

A full Flatcar build, starting from a clean environment and ending with a bootable image, takes around 2 hours on a modern build environment. On a state-of-the-art setup, this can be reduced to 1.5 hours.

#### Ideal Future Situation

This document outlines the best ways to achieve the fastest builds possible in terms of hardware, software, and workflow. The Flatcar team is also considering instrumenting the build process to provide more detailed telemetry, using tools like `otel-cli`.

#### Hardware Requirements

- **CPU**: AMD64 box with a minimum of 4-8 real cores. Increasing cores beyond 32 offers only marginal speedups.
- **Storage**: NVMe storage is a must, ideally PCIe 3. Benchmark with:
  ```bash
  dd if=/dev/random of=test.img oflag=direct,sync bs=4k count=81920 status=progress
  ```
  Target a result of around 20-30MB/s.

- **RAM**: Use RAMFS/TMPFS for optimal performance. Ensure at least 64 GB of RAM, as the build itself requires 6-8 GB, and TMPFS needs 30-50 GB.
  ```bash
  dd if=/dev/random of=test.img oflag=direct,sync bs=4k count=81920 status=progress
  ```

  Target 200-300MB/s using RAMDISK.

- **Disk Space**: Ensure at least 25-50 GB of free space depending on the number of builds.

- **Network**: Fast Internet is essential, as Flatcar's dockerized environment requires downloading the 10GB SDK image. During the build, several Rust crates and Go modules are downloaded from source repositories.

#### Software Requirements

- **Docker Engine**: If using RAMDISK, ensure Docker’s root-data is set to the RAMDISK mount point.
- **qemu**: Required for ARM64 builds and for testing VM images.

#### Workflow for Building Flatcar

1. **Create RAMDISK**: For the fastest build times, set up a RAMDISK for storage.
2. **Install Docker Engine**: Set the Docker root-data to the RAMDISK mount point if using RAMDISK.
3. **Clone the Flatcar Scripts**:
   ```bash
   git clone https://github.com/flatcar/scripts
   ```
   Clone the repository onto the RAMDISK for best speedups.
4. **Run the SDK Container**:
   ```bash
   ./run_sdk_container -t
   ```
   This command downloads the latest Docker SDK container image, which is around 10GB.
5. **Build Packages**:
   ```bash
   ./build_packages
   ```
6. **Build the Image**:
   ```bash
   ./build_image
   ```
7. **Convert Image for VM Testing**:
   ```bash
   ./image_to_vm.sh <params>
   ```
   Use `qemu-kvm` to create a VM instance and test the image.

#### Additional Tips and Tricks

- **Binary Packages**: Use `-U` with `./run_sdk_container` if you want to use binary packages, though full builds generally rebuild everything.
- **Tmpfs**: Using Tmpfs can provide additional speedups. However, in some cases, using NVMe might not differ significantly.
- **Parallel Fetch**: Enable `parallel-fetch` in Portage to download files in the background during the build.
- **Rust/Go Module Download Bottleneck**: A significant bottleneck is the sequential download of Rust crates and Go modules. Parallel downloads or HTTP connection reuse could help speed this up.
  ```bash
  ./build_packages --fetchonly
  ```
  This command fetches all required packages. In one test, it took 24 minutes to fetch all 433 Rust crates.

**Discussion and Further Insights**: For ongoing discussions and further insights on optimizing Flatcar builds, refer to the [GitHub issue #1550](https://github.com/flatcar/Flatcar/issues/1550).

#### Optimization Insights

- **Instrumenting Build Timeline**: Using tools like `otel-cli` can provide visibility into build delays.
- **Cyclic Dependencies**: With nightly builds (4100.0.0 or newer), cyclic dependencies have been resolved, speeding up `build_packages` by ~30%. https://github.com/flatcar/scripts/pull/2340
- **Binary Package Considerations**: Binary packages for releases build faster due to CDN availability, while nightly builds rely on a single server (bincache).
- **Tmpfs in SDK Container**: To avoid messing with your host system, you can mount a tmpfs inside the SDK container at `/build/amd64-usr`.
- **Emerging Package Statistics**: Tools like `genlop` can provide detailed build statistics from Portage logs.

#### Example Builds

- **Equinix Metal**: A suitable machine can reduce build time to within 1 hour. Ideal setups include modern development environments like the m3 or a3 systems.
- **Build Log Insights**: A recent test build on a 24-core i9-13900HX laptop took less than 45 minutes for a full package build. Load is distributed unevenly, with some bottlenecks in dependency installation. Reordering builds could help maximize resource usage.

For detailed build statistics, consider using `genlop` to track build times and dependencies.
```
