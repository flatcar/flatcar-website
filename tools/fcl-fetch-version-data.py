#!/usr/bin/env python3
#
# Fetch FCL version details.
#
# This script fetches the version information and relevant data and prints it
# so it can be used to compose the front-matter for FCL docs.
#
# Copyright Kinvolk 2020
#
# Authors:
#   Vincent Batts <vincent@kinvolk.io>
#   Joaquim Rocha <joaquim@kinvolk.io>

import glob
import json
import sys
import shlex
import urllib.request

import yaml


def fetch(url):
    return urllib.request.urlopen(url).read().decode('utf-8')

def latestVersion(channel = 'stable', board = 'amd64-usr'):
    url = 'https://%s.release.flatcar-linux.net/%s/current/version.txt' % (channel, board)
    try:
        versionTxt = fetch(url)
        s = shlex.shlex(versionTxt, posix = True, punctuation_chars = '=')
        s.whitespace_split = True
        for item in s:
            if item == 'FLATCAR_VERSION':
                items = list(s)
                if len(items) < 2 or items[0] != '=':
                    raise 'malformed version.txt'
                return items[1]
    except:
        return 'unreleased'

def listAMIs(channel = 'stable', board = 'amd64-usr'):
    url = 'https://%s.release.flatcar-linux.net/%s/current/flatcar_production_ami_all.json' % (channel, board)
    try:
        allAMIs = json.loads(fetch(url))
        return allAMIs['amis']
    except:
        return []

def main(file_to_replace):
    stableAMD = latestVersion('stable')
    betaAMD = latestVersion('beta')
    alphaAMD = latestVersion('alpha')
    ltsAMD = latestVersion('lts')
    stableARM = latestVersion('stable', 'arm64-usr')
    betaARM = latestVersion('beta', 'arm64-usr')
    alphaARM = latestVersion('alpha', 'arm64-usr')
    ltsARM = latestVersion('lts', 'arm64-usr')

    data = {
        '__DUMMY__' : {
            'lts_azure_sku' : 'lts2024',
            'stable_channel' : stableAMD,
            'beta_channel' : betaAMD,
            'alpha_channel' : alphaAMD,
            'lts_channel' : ltsAMD,
            'stable_channel_arm' : stableARM,
            'beta_channel_arm' : betaARM,
            'alpha_channel_arm' : alphaARM,
            'lts_channel_arm' : ltsARM,
            'data' : {
                'stable_channel' : {
                    'amis' : listAMIs('stable')
                },
                'beta_channel' : {
                    'amis' : listAMIs('beta')
                },
                'alpha_channel' : {
                    'amis' : listAMIs('alpha')
                },
                'lts_channel' : {
                    'amis' : listAMIs('lts')
                },
                'stable_channel_arm' : {
                    'amis' : listAMIs('stable', 'arm64-usr')
                },
                'beta_channel_arm' : {
                    'amis' : listAMIs('beta', 'arm64-usr')
                },
                'alpha_channel_arm' : {
                    'amis' : listAMIs('alpha', 'arm64-usr')
                },
                'lts_channel_arm' : {
                    'amis' : listAMIs('lts', 'arm64-usr')
                },
            }
        }
    }

    yaml_data = yaml.dump(data)

    with open(file_to_replace, 'r') as f:
        contents = f.read()
        print(contents.replace('@@FCL_VERSION_DATA@@', yaml_data).replace('__DUMMY__:\n', ''))

if __name__ == '__main__':
    file_to_replace = sys.argv[1]
    main(file_to_replace)
