+++
tags = ["flatcar", "security", "ssl"]
topics = ["Linux", "openssl"]
authors = ["mathieu-tortuyaux"]
title = "TEST OpenSSL-3.0.0 on Flatcar: what to expect?"
draft = false
aliases = ["/blog/2021/10/openssl-on-flatcar"]
description = "OpenSSL has been ugpraded to 3.0.0 on Flatcar Container Linux, what are the changes from a user point of view?"
date = "2021-10-27T20:00:00+02:00"
postImage = "/flatcar-openssl.jpg"
+++

In the Open-Source Software ecosystem, actions often start with an opened issue. In this journey, it was the [flatcar-linux/Flatcar#418][issue-418] - but before talking about OpenSSL-3.0 on Flatcar, let's take two steps back.

**TL; DR**: Let's upgrade to OpenSSL v3 for a whole operating system and spoiler alert, the issue was misleading: almost nothing broke.

[Flatcar Container Linux][flatcar] (FCL) is an open-source Linux distro, optimized to run container workloads and based on Gentoo. One particularity of FCL is the lack of package manager: it's not possible to install softwares with tools like `emerge`, `pacman` or `yum` - this design ensures reproducibility and security.
It's the responsibility of the community and the FCL core maintainers to manage the lifecycle of packages: from selection to the upgrades and applying FCL patches.

[OpenSSL][openssl] is an open-source library used for ciphering and hashing. As a library, it is widely used by programming software and third-party programs to ensure security, we can easily see the dependencies to OpenSSL by inspecting the linked shared objects for some famous software:

```shell
$ ldd $(which curl) | grep ssl
	libssl.so.1.1 => /usr/lib64/libssl.so.1.1 (0x00007f1c07871000)
$ ldd $(which wget) | grep ssl
	libssl.so.1.1 => /usr/lib64/libssl.so.1.1 (0x00007f77190d3000)
$ ldd $(which ssh) | grep crypto
	libcrypto.so.1.1 => /usr/lib64/libcrypto.so.1.1 (0x00007ff139991000)
$ equery belongs \
    /usr/lib64/libcrypto.so.1.1 \
    /usr/lib64/libssl.so.1.1
 * Searching for /usr/lib64/libcrypto.so.1.1,/usr/lib64/libssl.so.1.1 ...
dev-libs/openssl-1.1.1k-r1 (/usr/lib64/libcrypto.so.1.1)
dev-libs/openssl-1.1.1k-r1 (/usr/lib64/libssl.so.1.1)
```

It's easy to figure out why OpenSSL is a major piece for system security and why it's important to stay up-to-date with the upstream as distro maintainers.

## OpenSSL 3.0

The version 3 of OpenSSL [comes][openssl-released] after more than three years of development and around 7500 commits from more than 350 different authors. We can only salute this effort to bring more flexibility to OpenSSL by keeping backward compatility. That being said, let's highlight some new features of this massive work.

### Backward compatiblity

Most applications and scripts relying on CLI or libraries should continue to work the same as using previous implementations. Some warnings may be emitted at compilation time about deprecated functions but it's fine, it allows a smooth transition for software maintainers as we can read in this great [blogpost][alpine-openssl] from Alpine folks:
```
Roughly 85% of main builds just fine with OpenSSL 3, and 89% of community builds with it.
```

Again, openssl on the Flatcar host ought not be linked to by applications _deployed_ on Flatcar. All deployed applications should be containerized, and handle their own linking and dependencies.

Flatcar's CI has only reported one failing case: one test requires as dependency to generate self-signed certificates and this generation was failing. Issue has immediately been [reported][issue-16720] to the upstream and it has been fixed.

As a backward compatibility illustration, FCL uses [flatcar-linux/update_engine][update-engine] as a daemon to check, download and install new releases - this application has [dependencies][openssl-dependencies] to `openssl` libraries. In the OpenSSL-3.0 upgrade, FCL team has been able to successfully compile `update_engine` with some deprecation warnings, there is a tracking issue: [flatcar-linux/Flatcar#519][issue-519] to do the actual upgrade.

### Providers

With the providers feature, OpenSSL abstracts the usage of algorithm implementations in order to give more flexibility. There are currently four built-in providers:
* default
* legacy
* base
* null

This approach is really powerful: it allows developers to implement their own providers as long as they comply with the OpenSSL's provider definition - one good example is the `FIPS` module:

`FIPS` (stands for Federal Information Processing Standards) module is a set of algorithms fulfilling the `FIPS` compliance - this one is built by default on FCL starting from the release 3046.0.0 of the Alpha channel.
As a side note, OpenSSL has just [submitted][fips-submission] its `FIPS` module for being reviewed and validated by the NIST’s Cryptographic Module Validation Program. It's important to keep in mind that OpenSSL is `FIPS` compliant but not yet `FIPS` validated.

## Flatcar Container Linux and OpenSSL

Each of the above providers is actually a shared object (`.so`) which can be loaded during the OpenSSL execution based on the configuration.

Using `ignition`, it's possible to provision the FCL instance in early-boot. OpenSSL configuration file is located under `/etc/ssl/openssl.conf`, here follows a Container Linux Config example to configure Flatcar Container Linux to use the `FIPS` provider:

```yml
# To transpile to actual ignition config:
# ct --in-file ./config.yml --pretty > ./ignition.json
storage:
  files:
    - filesystem: "root"
      path: /etc/ssl/openssl.cnf.fips
      mode: 0644
      contents:
        inline: |
          config_diagnostics = 1
          openssl_conf = openssl_init

          # it includes the fipsmodule configuration generated
          # by the `enable-fips.service`
          .include /etc/ssl/fipsmodule.cnf

          [openssl_init]
          providers = provider_sect

          [provider_sect]
          fips = fips_sect
          base = base_sect

          [base_sect]
          activate = 1
systemd:
  units:
    - name: enable-fips.service
      enabled: true
      contents: |
        [Unit]
        Description=Enable OpenSSL FIPS provider
        ConditionPathExists=!/etc/ssl/fipsmodule.cnf
        After=system-config.target

        [Service]
        Type=oneshot
        RemainAfterExit=yes
        ExecStart=/usr/bin/openssl fipsinstall \
          -out /etc/ssl/fipsmodule.cnf \
          -module /usr/lib64/ossl-modules/fips.so
        ExecStart=/usr/bin/mv /etc/ssl/openssl.cnf.fips /etc/ssl/openssl.cnf

        [Install]
        WantedBy=multi-user.target
```

Once booted, the instance should run with OpenSSL `FIPS` provider, it's possible to easily check with the following commands (MD5 is not `FIPS` compliant):

```shell
$ echo "Flatcar + FIPS" | openssl sha1 -
SHA1(stdin)= ee2219bd6a234fa0e4436b475fc3b351e2dc85a0
$ echo "Flatcar + FIPS" | openssl md5 -
Error setting digest
C0E28D0B5F7F0000:error:0308010C:digital envelope routines:inner_evp_generic_fetch:unsupported:crypto/evp/evp_fetch.c:346:Global default library context, Algorithm (MD5 : 104), Properties ()
C0E28D0B5F7F0000:error:03000086:digital envelope routines:evp_md_init_internal:initialization error:crypto/evp/digest.c:234:
```

Flatcar Container Linux aims to reduce the attack surface of the distribution by shipping just the right amount of necessary software. It's a fragile balance from a distro maintainer's point of view; FCL must offer enough flexibility to the user while ensuring the consistency of the OS: with its version 3, OpenSSL fulfills these two requirements.

[issue-418]: https://github.com/flatcar-linux/Flatcar/issues/418
[flatcar]: https://flatcar-linux.org
[openssl]: https://www.openssl.org
[update-engine]: https://github.com/flatcar-linux/update_engine
[openssl-dependencies]: https://github.com/flatcar-linux/update_engine/blob/flatcar-master/src/update_engine/omaha_hash_calculator.cc#L10-L12
[issue-519]: https://github.com/flatcar-linux/Flatcar/issues/519
[820173]:https://bugs.gentoo.org/820173
[alpine-openssl]: https://ariadne.space/2021/10/01/bits-related-to-alpine-security-initiatives-in-september/
[fips-submission]: https://www.openssl.org/blog/blog/2021/09/22/OpenSSL3-fips-submission/
[issue-16720]: https://github.com/openssl/openssl/issues/16720
[alpine-openssl]: https://ariadne.space/2021/09/16/the-long-term-consequences-of-maintainers-actions/
[openssl-released]: https://www.openssl.org/blog/blog/2021/09/07/OpenSSL3.Final/
