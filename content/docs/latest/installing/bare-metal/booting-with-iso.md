---
title: Booting Flatcar Container Linux from an ISO
linktitle: Booting from an ISO
weight: 10
aliases:
    - ../../os/booting-with-iso
    - ../../bare-metal/booting-with-iso
---

The latest Flatcar Container Linux ISOs can be downloaded from the image storage site:

<div id="iso-images">
  <ul class="nav nav-tabs">
    <li class="active"><a href="#stable" data-bs-toggle="tab">Stable Channel</a></li>
    <li><a href="#beta" data-bs-toggle="tab">Beta Channel</a></li>
    <li><a href="#alpha" data-bs-toggle="tab">Alpha Channel</a></li>
  </ul>
  <div class="tab-content coreos-docs-image-table">
    <div class="tab-pane" id="alpha">
      <div class="channel-info">
        <p>The Alpha channel closely tracks master and is released frequently. The newest versions of system libraries and utilities will be available for testing. The current version is Flatcar Container Linux {{< param alpha_channel >}}.</p>
      </div>
      <a href="https://alpha.release.flatcar-linux.net/amd64-usr/current/flatcar_production_iso_image.iso" class="btn btn-primary">Download Alpha ISO</a>
      <a href="https://alpha.release.flatcar-linux.net/amd64-usr/current/" class="btn btn-default">Browse Storage Site</a>
      <br/><br/>
      <p>All of the files necessary to verify the image can be found on the storage site.</p>
    </div>
    <div class="tab-pane" id="beta">
      <div class="channel-info">
        <p>The Beta channel consists of promoted Alpha releases. The current version is Flatcar Container Linux {{< param beta_channel >}}.</p>
      </div>
      <a href="https://beta.release.flatcar-linux.net/amd64-usr/current/flatcar_production_iso_image.iso" class="btn btn-primary">Download Beta ISO</a>
      <a href="https://beta.release.flatcar-linux.net/amd64-usr/current/" class="btn btn-default">Browse Storage Site</a>
      <br/><br/>
      <p>All of the files necessary to verify the image can be found on the storage site.</p>
    </div>
    <div class="tab-pane active" id="stable">
      <div class="channel-info">
        <p>The Stable channel should be used by production clusters. Versions of Flatcar Container Linux are battle-tested within the Beta and Alpha channels before being promoted. The current version is Flatcar Container Linux {{< param stable_channel >}}.</p>
      </div>
      <a href="https://stable.release.flatcar-linux.net/amd64-usr/current/flatcar_production_iso_image.iso" class="btn btn-primary">Download Stable ISO</a>
      <a href="https://stable.release.flatcar-linux.net/amd64-usr/current/" class="btn btn-default">Browse Storage Site</a>
      <br/><br/>
      <p>All of the files necessary to verify the image can be found on the storage site.</p>
    </div>
  </div>
</div>

## Known limitations

1. UEFI boot is not currently supported. Boot the system in BIOS compatibility mode.
2. There is no straightforward way to provide an [Ignition config][cl-configs].
   As a workaround though, it is possible to leverage the vga console to assign a password to the core user (sudo passwd core).
   Once a password is set, it would be possible to provide a Butane or an Ignition file via SSH/SCP.
3. A minimum of 2 GB of RAM is required to boot Flatcar Container Linux via ISO.

## Install to disk

The most common use-case for this ISO is to install Flatcar Container Linux to disk. You can [find those instructions here][installing-to-disk].

## No authentication on console

The ISO is configured to start a shell on the console without prompting for a password. This is convenient for installation and troubleshooting, but use caution.

[cl-configs]: ../../provisioning/cl-config
[installing-to-disk]: installing-to-disk
