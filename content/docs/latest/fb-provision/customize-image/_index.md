---
title: Image Customization
description: >
  This section provides information and guidance on customizing
  Flatcar images by placing files on the root or OEM filesystem or embedding an Ignition config.
weight: 35
aliases:
    - /docs/latest/installing/customizing-the-image/
---

Image customization prepares a Flatcar image before it boots for the first time. Use this workflow when configuration needs to live on the image itself, for example when embedding an Ignition config, staging files on the root or OEM filesystem, or distributing a pre-configured image. For most first-boot configuration, delivering a Butane or Ignition config to a stock image is the recommended path.

- [Customize the image](./customize-the-image.md)
