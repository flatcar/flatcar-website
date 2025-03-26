---
title: 'Open Source Linux OS for Hosting Containers'
link: https://flatcar-linux.org/
logo: '/images/flatcar-logo.svg'
logo_bg_img: 'product-bg-1'
tagline: 'Container Linux'
description: "Experience community-powered innovation with enterprise-grade security, automated updates, and streamlined maintenance for scalable container deployments."
cta: Learn more
cta_aria_label: Learn more about Flatcar Container Linux
aliases:
  - /flatcar-linux
  - /flatcar
display_on_home: true
docs:
  link: https://flatcar-linux.org/docs/latest/
  action_text: Get Started
support:
  link: https://flatcar-linux.org
  action_text: Visit Website
style:
  bgcolor: "#072365"
  fgcolor: "#ffffff"
  accent:
    bgcolor: "#041552"
    fgcolor: "#09bac8"
hero:
  merge: true # Will merge these hero definitions into this section pages
  button:
    text: "Start using Flatcar"
    link: "/docs/latest/#getting-started"
    footnote:
      text: "Operates on more than {{}} machines across the globe"
      count: "80 000+"
  style:
    class: header-bg-flatcar
    bgcolor: '#12172c'
    fgcolor: '#08a2af'
    descriptioncolor: white
community_section: true
community_links:
  groups:
    - title: "Contribute & Collaborate"
      items:
        - title: ""
          link: "https://github.com/flatcar"
          external_svg: "GitHub_Lockup_Dark.svg"
          class: "github-wordmark"
    - title: "Stay Updated & Follow Us"
      items:
        - title: "@flatcar"
          icon: "x-twitter"
          link: "https://x.com/flatcar"
        - title: "Bluesky"
          icon: "bluesky"
          link: "https://bsky.app/profile/flatcar.org"
        - title: "Mastodon"
          icon: "mastodon"
          link: "https://hachyderm.io/@flatcar"
    - title: "Ask Questions & Connect"
      items:
        - title: "Matrix"
          svg_path: "/images/matrix-icon.svg"
          link: "https://app.element.io/#/room/#flatcar:matrix.org"
        - title: "Slack"
          icon: "slack"
          link: "https://kubernetes.slack.com/archives/C03GQ8B5XNJ"
sponsors_sections:
  - title: Made possible by project sponsors including
    area: flatcar
    type: sponsor
providers_sections:
  - title: Supported wherever you run your containers
    type: flatcarCloudProvider
quick_features:
  title: Why Flatcar Container Linux?
  description: Imagine an OS that works as hard as you do—streamlining your container infrastructure while cutting costs, reducing headaches, and safeguarding your business. Flatcar is engineered for those who demand efficiency, reliability, and peace of mind.
  features:
    - text: "*Minimal & Focused*. Only the essential tools to run your containers—eliminating bloat. No package manager, no configuration drift."
      icon: container
      shape: shape-blue-1
    - text: "*Fortress-Level Security.* An immutable, read-only filesystem that drastically minimizes attack surfaces, giving you the confidence to scale without compromise."
      icon: filesystem
      shape: shape-blue-2
    - text: "*Effortless, Automated Updates:* Atomic, hands-free updates ensure your system is always at peak security and performance, freeing you to focus on growth."
      shape: shape-blue-3
      icon: update
highlights:
  - icon: 'lock'
    title: Secure by Design
    description: Immutable filesystem, minimal footprint, automated security updates are just some of the built-in security features
  - icon: 'wrench'
    title: Built for Containers
    description: The OS image shipped includes just the minimal amount of tools to run container workloads.
  - icon: 'gear'
    title: Automated Updates
    description: Keep your cluster secure by always running an OS with the latest security updates and features
features:
  - title: The Container Infrastructure OS
    icon: container-feature.svg
    style:
      fgcolor: '#46c1c7'
      bgcolor: '#12172c'
    description: 'Flatcar Container Linux is designed from the ground up for running container workloads. It fully embraces the container paradigm, including only what is required to run containers.'
    highlights:
      - icon: flatcar-app
        title: Immutable infrastructure
        description: Your immutable infrastructure deserves an immutable Linux OS. With Flatcar Container Linux, you manage your infrastructure, not your configuration.
      - icon: flatcar-app
        title: Designed to scale
        description: Flatcar Container Linux includes tools to manage large-scale, global infrastructure. You can manage update polices, versions and group instances with ease.
      - icon: flatcar-app
        title: Reduced complexity
        description: With containers, dependencies are packaged and delivered in container images. This makes package managers unnecessary and simplifies the OS.
  - title: Secure by Design
    icon: secure-feature.svg
    style:
      fgcolor: '#fddc60'
      bgcolor: '#12172c'
    description: Flatcar Container Linux's built-in security features, minimal design and automated updates provide a strong foundation for your infrastructure's security strategy.
    highlights:
      - icon: flatcar-secure
        title: Security patch automation
        description: Running the latest security patches is crucial to removing potential vulnerabilities. Flatcar Container Linux's automated updates does this for you.
      - icon: flatcar-secure
        title: Immutable filesystem
        description: By making the system partition read-only, Flatcar Container Linux eliminates a whole class of high-impact security vulnerabilities.
      - icon: flatcar-secure
        title: Minimal attack surface
        description: Flatcar Container Linux includes only what is required to run containers. By minimizing the size and complexity of the OS, the attack surface is also reduced.
  - title: Automated Updates
    icon: update-feature.svg
    style:
      fgcolor: '#31bb4d'
      bgcolor: '#12172c'
    description: With Flatcar Container Linux, you'll always be running the most stable, secure and up-to-date Flatcar version by taking advantage of the automated, atomic update feature.
    highlights:
      - icon: flatcar-update
        title: Self-driving updates
        description: Flatcar Container Linux uses the same reliable update mechanism as Google's ChromeOS to provide safe, secure and automated system updates.
      - icon: flatcar-update
        title: Always up-to-date
        description: With Flatcar Container Linux's automated updates, you'll benefit from always running the most stable, secure and feature-rich version of the OS.
      - icon: flatcar-update
        title: Managed updates
        description: The Nebraska update server allows for defining instance groups, assigning update channels and controlling the frequency, time of day and rate of updates.
sponsors_section: true
providers_section: true
testimonials_section: true
cascade:
  comparison_table: # This is used in the platform pages
    title: Which one is the right version for me?
    bottom_text: Enterprises that require 24x7 support can set up a direct support agreement with Kinvolk. [Get in touch](https://kinvolk.io/contact-us/) with us if you want to know more.
    table:
      header:
      - title:
      - title: Flatcar
      - title: Flatcar Pro
      - title: Flatcar LTS
      rows:
        - cols:
          - text: Container optimized OS including a minimal image and immutable file-system
          - icon: list-check
          - icon: list-check
          - icon: list-check
        - cols:
          - text: Built-in security features and automatic updates
          - icon: list-check
          - icon: list-check
          - icon: list-check
        - cols:
          - text: Standard Commercial Support by Kinvolk
          -
          - icon: list-check
          - icon: list-check
        - cols:
          - text: FIPS support to meet security compliance requirements
          -
          - icon: list-soon
          - icon: list-check
        - cols:
          - text: Cadence for new major releases
          - text: 2 months
          - text: 2 months
          - text: 12 months
        - cols:
          - text: Timespan for security updates
          - text: Until next release
          - text: Until next release
          - text: 18 months
        - cols:
          - text: Marketplace-delivered with platform specific optimizations
          -
          - icon: list-check
          - icon: list-soon
  resources_section:
    title: Do more with Flatcar
    description: Discover your infrastructure's potential
    style: light
    resources:
      - title: Case Studies
        icon: page-text
        link: /blog/2019/07/how-pubnative-is-saving-30-on-infrastructure-costs-with-kinvolk-packet-and-kubernetes/
      - title: Documentation
        icon: page-chart
        link: https://flatcar-linux.org/docs/latest/
      - title: Security
        icon: lock-black
        link: /flatcar-container-linux/security
      - title: FAQ
        icon: chat
        link: /flatcar-container-linux/faq
      - title: Release Notes
        icon: page-write
        link: /flatcar-container-linux/releases
  contact:
    message: '# Get in touch!'
    simple: true
---
