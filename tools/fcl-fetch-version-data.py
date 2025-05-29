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

def listChinaAMIs(channel = 'stable', board = 'amd64-usr'):
    url = 'https://flatcar-prod-ami-import-cn-north-1.s3.cn-north-1.amazonaws.com.cn/%s-%s.json' % (channel, board)
    try:
        allAMIs = json.loads(fetch(url))
        return allAMIs['amis']
    except:
        return []

def main(file_to_replace):
    stableAMD = latestVersion('stable')
    betaAMD = latestVersion('beta')
    alphaAMD = latestVersion('alpha')
    edgeAMD = latestVersion('edge')
    stableARM = latestVersion('stable', 'arm64-usr')
    betaARM = latestVersion('beta', 'arm64-usr')
    alphaARM = latestVersion('alpha', 'arm64-usr')
    edgeARM = latestVersion('edge', 'arm64-usr')

    data = {
        '__DUMMY__' : {
            'alpha_channel' : alphaAMD,
            'beta_channel' : betaAMD,
            'edge_channel' : edgeAMD,
            'stable_channel' : stableAMD,
            'alpha_channel_arm' : alphaARM,
            'beta_channel_arm' : betaARM,
            'edge_channel_arm' : edgeARM,
            'stable_channel_arm' : stableARM,
            'data' : {
                'alpha_channel' : {
                    'amis' : listAMIs('alpha')
                },
                'beta_channel' : {
                    'amis' : listAMIs('beta')
                },
                'edge_channel' : {
                    'amis' : listAMIs('edge')
                },
                'stable_channel' : {
                    'amis' : listAMIs('stable')
                },
                'stable_china_channel': {
                    'amis': listChinaAMIs('stable')
                },
                'alpha_channel_arm' : {
                    'amis' : listAMIs('alpha', 'arm64-usr')
                },
                'beta_channel_arm' : {
                    'amis' : listAMIs('beta', 'arm64-usr')
                },
                'edge_channel_arm' : {
                    'amis' : listAMIs('edge', 'arm64-usr')
                },
                'stable_channel_arm' : {
                    'amis' : listAMIs('stable', 'arm64-usr')
                }
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
