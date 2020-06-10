---
title: "Signing Key for testing Flatcar ARM images"
date: 2019-10-10T16:40:00+02:00
draft: false
---

## Background

For testing experimental Flatcar ARM64 images,
we need a GPG key with an ID of A7D6E04307F00419. The key can be downloaded below.

<a href="https://www.flatcar-linux.org/security/image-signing-key/Flatcar_ARM_Testing_Key.asc"><button type="button" class="btn btn-light">Download the key for testing Flatcar ARM</button></a>

## Usage

Download the key and import it into your local GPG key ring:

```
$ cd /tmp
$ curl -LO https://www.flatcar-linux.org/security/image-signing-key/Flatcar_ARM_Testing_Key.asc
$ gpg --import Flatcar_ARM_Testing_Key.asc
gpg: key 0xA7D6E04307F00419: public key "Flatcar ARM testing key (key for testing experimental Flatcar ARM images) <buildbot@flatcar-linux.org>"
gpg: Total number processed: 1
gpg:               imported: 1
```

To verify the integrity of a file, you can now use GPG's `--verify` command.

For example, to verify a `flatcar_production_pxe_image.cpio.gz` image file:

```
$ gpg --verify flatcar_production_pxe_image.cpio.gz.sig flatcar_production_pxe_image.cpio.gz
```

## Flatcar ARM image testing key

```
-----BEGIN PGP PUBLIC KEY BLOCK-----

mQINBF2fNssBEACUV1pX7iLkgugif9fu+GgtZltkpM1vSrpA299So+MLA+gcYNzi
gPosSKIytEd6ZJkeUfG7ZO5xmGU+y0e71IJZZyu+JYEfsh/mWPrasvd18FHjObpx
ne27Q2C0UwO+C4GdMB1kDhVPs0V6l2HkYB9wERpBFk3SNcX4jpjSsIgTNLSaxytB
zXU6F+cj65qGtHDdImnRPvfQQ0fAX+E0yqmQFd7z2oHQ8b+piUOBzKLH837cdtyx
TlQyaJkLxMSq5H1j1wjNqSML6jExnP2/ucbEFjEmQ8QYDsH5G2/Q3uaVMnD0uEzb
rcGWCa9xapEHgZ1GtPR/ba/huKOAgiw3A3AirxuAwxAUcX6gkVRqe7ws4bWbvsxv
uHmW5iC3Sp8zQ8SQ6MJXipe6WIdA+5IVIMYsSwiBgJLH6ZaQMBRRL1kLp38sZyQt
u90EN5eEIQDDikOUpS9R5nbHYsZ5Nz0SpuE3NG3LHrZ1CTdNidYkPZtrAPrFG2I1
JxvcNdMXeM8z4bhUiA9/knJzz8wgCB+xEDBlHJs5ULjwMC0oU3RNLO1OObxkCHTM
nHVbIT3oFphcPwvDOihGGXaqlj4/CHFwKGJvCoOsWnIt/kMWYfUCDqix5au9dAFT
9Wpf6S6EvK84pI+bMrcwM0vu9zPSbt0dZ425pP8h44M5jVJ1bgPW/c9BjwARAQAB
tGZGbGF0Y2FyIEFSTSB0ZXN0aW5nIGtleSAoa2V5IGZvciB0ZXN0aW5nIGV4cGVy
aW1lbnRhbCBGbGF0Y2FyIEFSTSBpbWFnZXMpIDxidWlsZGJvdEBmbGF0Y2FyLWxp
bnV4Lm9yZz6JAk4EEwEIADgWIQR2/l4l3W18ho4gAxSn1uBDB/AEGQUCXZ82ywIb
AwULCQgHAgYVCgkICwIEFgIDAQIeAQIXgAAKCRCn1uBDB/AEGZXzD/0Q0HoLLzyo
vkWPz51lCCxggTsuLvr54qzMQLf1zqsKD/wJZUv+ck8zHHraHXrQkCXMEa1punyd
xNQoxb5eYJqYzwGoyBrRtw+/Ar6TecFdmOWJrg+1lnIiKpHswJVWWI10RhA7kjOx
xRUcbjcX8MkYP0CBTzcj595Xe25Lioucv718bcDkxVIsAEF1GpKUtQTq05mPM6kZ
MjlHUA2Msh9mMiGiWEnV4j6nbA4OFNHQJdJuX47d9x4Nin0F4zjlVf6c+bSn1F72
Nhca2PkzrkMxskJbTIlKoKa4W7D05K0gg8x0vXPPinHtHrYOND643DRBSAx7tHJk
iSlqH0nI3ZUGf9+wcKiz+SFRxpR4jCtM0K0w4TyEgMeMzLJlrCwbib3wSItg/VJG
J6AmJhh6Hfb2N/UocwzLZPCZ89NeUNhfFzKmGT4SZNEa/cwjr+37clrFUcNgRVSL
x2xm4NrXCFcChxBQok+5ioZi6ibvo/USTZEvvav9L3UgGvLHTXB9vCfiH1hBSYjJ
bamrBPoUKDkot4gVY2+H083pMhpZ/zETGKNp/3WBKYMaroslSXtsoYYQ8U9cq26Y
iya44e7hVBFVc5DTS7D0NzSmDC6w2KnkGs5z4jclyLcCUtl4ZtUAMVudMYQVuHMS
oONWP/Mr+6l85gEGGym7Qvf14BZ+r0Q817kCDQRdnzbLARAAtMe5XTwhfp4bWRVm
OAhlv3UBtH7v69xJ8Mp7BdoFOmQipr7MlaB4ZF/iQgKeU6DTgr9fLY9LvdommmFb
sH4A0dekb19+FNzkhf8ezUwzVTOHKa+u9lHll2sgskKniAMZEdVBXYIAmOb/Mws+
/ndIqzO/dQBlRjTFW1bPyGOYjVUCsFTYPwOnfxOUT+4OftSIXIw9Y2VT/Zlpoiv/
0U9xNT9O22iDUgvZCNh7ja6HqtkUk3CT6XV7AckH7rYHDFsV0uU/lBFu9jAElW3P
S7BqIIvtRD2Y6tKhnyWdbrKyObx830jfNFpX61O3v1v3tiJkFmRyy+5weY4aIeYE
rDGumslTMrVGEGiJES1pSffZCMI8hxQ97/DCt14/WjRTNbizXkzXLhMopcDscEvd
6iQcd8G/R1v2/7E/+H+lG+Zl0E3ynBV986xHN2Q7EOvVDV++kFQzPjOPY7IILdGL
BP019lOOK+51bCXb3zxLKYLBehDDuK6anzIwADRC6S6FZBGMXwzLJFfpsp6P4k0Z
e3AUJRzTOcc0y0s2zFU6hKoZ/bvOFUKQ8a2XD23iTuxhRv7tZu19O87WthFj/rX7
COnDsfZdaYmZ7oJQAZ1qMAkwxR+1fQug0lRpb4lTgLRgUW69WSZGXsiROLoNV+Sp
aOjv/1CwNrIoLwWPEbVasOeeHN0AEQEAAYkCNgQYAQgAIBYhBHb+XiXdbXyGjiAD
FKfW4EMH8AQZBQJdnzbLAhsMAAoJEKfW4EMH8AQZNDEP/0Mab27UanfoLctR7vrs
9I2RcIYyc/jzAfVVkaxhjiL7cjJnvlCagNkvgOOnudqmwSe9QXxt32p1TBCnyC61
teghxjF2YBP4nKYk6JtJn9ZCpZ8LMayY6nKFYQ/HmogvmH9HH68LPsNwhf2V6Q2a
q/XD5Y9+ot9q5XTOKTCopG6WFHBQIh9lNg7WVm1w15zLYZv7er8Rzxk3urcNMZOM
y91hE169aqaQ83DVSXS97Pd3Xhy/EatD1Mxz2NS0QIxMG18zjLV7QPlIxETD0wTx
fVpaWogiD8Lwt1+Bqv4pRytlJ7IY/ayIjQ+KLMq2iOunqtbA8HEdy73CYtH+aAwD
qq46NFW4QR/v89niDsajnpm99WlMu6r1PHmPqMK23zXxAtXZgvg2HpKzRsbLulrp
ixujSohVTGBl+JhkkvtDsnxr9mTaRY1ciu7/ChSo17WxAbL82FOFjKNYNxncvDnr
G8iAZyk1PDQB/8YoWL4cm4F8frHX9fRDw1/XStUQ2Q9O88Zk/5zyA15Ea3+nugmw
XTMrGY3K9adfU+T5WsFIaYwrbC6jkIrP+OeTbk7rSSIyMUnvk6Uq9e9ypPveELiv
0LYWIlw3wceGeMiygzigEUWGJLkXSHsXErE7cZqh36OGqKn3oQZ9WtIpZ7W1+SMz
59dwyZ21soOkG2TjCFRJ0Q/4
=nnzN
-----END PGP PUBLIC KEY BLOCK-----
```
