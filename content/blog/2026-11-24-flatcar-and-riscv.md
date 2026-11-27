+++
tags = ["flatcar", "riscv", "risc-v"]
topics = ["cpu-architecture", "riscv"]
authors = ["adrian-vladu"]
title = "Flatcar is welcoming RISC-V architecture"
draft = false
description = "Flatcar is now running on RISC-V physical boards and running local LLM on GPU."

date = "2026-11-24T10:00:00+00:00"
postImage = "/qwen-8b.png"
aliases = ["/blog/2026/11/flatcar-risc-v/"]
+++

Flatcar can now be used for local AI inference on RISC-V boards with reasonably good models.

## Flatcar and RISC-V in the Age of local AI

llama-cpp running an 8B model on Flatcar deployed on a HiFive Unmatched RISC-V board, which has an AMD connected GPU.

{{< figure src="/media/flatcar-riscv/flatcar-uname.png" alt="Flatcar uname output on a RISC-V board" width=600 >}}
{{< figure src="/media/flatcar-riscv/flatcar-vulkan.png" alt="Vulkan GPU information on Flatcar RISC-V" width=600 >}}
{{< figure src="/media/flatcar-riscv/qwen-30b.png" alt="Qwen 30B inference running on Flatcar RISC-V" width=600 >}}

## Why

Flatcar welcomes open source and for the last few years, the RISC-V open source architecture has started to become more readily available and mature.

## Technicalities - the abridged version

### Flatcar RISC-V implementation

The first implementation for Flatcar on RISC-V was show-cased at FOSDEM 2025 https://archive.fosdem.org/2025/schedule/event/fosdem-2025-6036-add-risc-v-support-to-your-favorite-operating-system/, almost two years ago.
The initial work was done as a proof of concept, to show that Flatcar can be run on RISC-V and the end goal that was achieved was to run Flatcar using QEMU software emulation.

The work has been recently resumed and the goal was to have Flatcar running on real hardware as an intermediate goal, with the main one to run real AI workloads.

### Bill of materials

- Hifive Unmatched Rev B with 16 GB RAM
- AMD 580 8GB VRAM GPU
- 550W power source - compatible with the GPU's 6+2 pins
- MicroSD card with u-boot and sbi partitions
- NVME for the Flatcar OS and local models

### Flatcar support for real RISC-V hardware

The starting point was Flatcar already running on QEMU, the biggest challenge that had to be overcome was to add support for that specific board.

The SiFive Unmatched required very specific Linux kernel configs, a DTB to be built, custom GRUB parameters, u-boot and sbi firmware blobs.


### AMD GPU on Flatcar

By default, the AMD GPU support (the `amdgpu` module) is enabled in Flatcar, but only for AMD64 architecture.
After enabling it for RISC-V architecture, the AMD GPU firmware had to be bundled as well as it was a hard requirement for the AMD 580 video card (Polaris firmware).

### llama-cpp on Flatcar

`llama-cpp` does support RISC-V, but it needs to be built from source. I have chosen to cross-compile it for RISC-V, as the compilation on Sifive would have been very slow.
The biggest hurdles on this step were to actually build a working `llama-cpp` for the exact CPU inside the Sifive Unmatched, as that CPU is rather old generation and
most of the more recent RISC-V CPU extensions were not available. After quite a lot of hit and miss, llama-cpp could happily run on the RISC-V board, in CPU mode only - as a first step.

Decode speed for small models like tiny-llama - 0.2 tokens per second. Not great numbers, but fully working at the expected performance.


### llama-cpp using the GPU

The plot thickens. Now, to use the AMD GPU, as both the RISC-V CPU and the AMD GPU are from older generation, the only backend available
was Vulkan. After a lot of hit and miss, using AI help from frontier models, I could successfully build llama-cpp for RISC-V, using the Vulkan backend.


As Flatcar is a base OS that can run containers, the obvious choice was to use an Ubuntu 24.04 container, where dependencies for Vulkan and Mesa were readily
available for the RISC-V toolchain.

### Quality of life

From the extensive model executions, there are some rough edges with the GPU support on RISC-V. Sometimes, the GPU crashes and hard resets are required.


## Future work

It would be great to see how Nvidia GPUs are working and what performance numbers can we get on RISC-V hardware.
Also, a comprehensive Kubernetes solution that bundles a local LLM, a harness and a user facing dashboard -  all on RISC-V.
This is definitely feasible short term.

## Short term and long term on the RISC-V Flatcar support

The idea is to have the bits and pieces for RISC-V architecture mainlined as soon as possible in Flatcar.
And when Flatcar users need it, to just switch a flag that enables official support for RISC-V in Flatcar. 


## Thank you

This work happened because a bunch of people put real time into it. Big thanks to:

- Gentoo upstream
- Chewi
- Thilo Fromm
