#!/usr/bin/env python3

import io
import os
import re
import sys

from optparse import OptionParser

import requests
import yaml
import json

known_architectures = ['amd64', 'arm64']
def release_arch_exists(origin_server, channel, arch, release, auth=None):
    code = requests.get('{}/{}/{}-usr/{}/version.txt'.format(
        origin_server, channel, arch, release), auth=auth).status_code
    if code == 401:
        raise Exception('forbidden, set LTS_USER and LTS_PASSWORD env vars')
    return code == 200

class Releases:
    def __init__(self,
                 origin_server='https://origin.release.flatcar-linux.net',
                 channel='stable',
                 auth=None):
        self.origin_server = origin_server
        self.channel = channel
        self.auth = auth

        self._list = self._init()
        self._index = len(self._list)

    def _init(self):
        releases = []
        for arch in known_architectures:
            headers = {
                'Accept': 'application/json'
            }
            releases_data = requests.get('{}/{}/{}-usr/'.format(
                self.origin_server, self.channel, arch), headers=headers, auth=self.auth)
            if releases_data.status_code == 401:
                raise Execption('forbidden, set LTS_USER and LTS_PASSWORD env vars')
            if releases_data.status_code != 200:
                continue
            releases += [release['Name'] for release in releases_data.json()]
        # Create deduplicated list of releases for all architectures
        return list(set(releases))

    def __iter__(self):
        return self

    def __next__(self):
        if self._index == 0:
            raise StopIteration
        self._index = self._index - 1
        return self._list[self._index]

class ReleaseInfo:
    def __init__(self,
                 origin_server='https://origin.release.flatcar-linux.net',
                 channel='stable',
                 release='current',
                 auth=None):
        self.origin_server = origin_server
        self.channel = channel
        self.release = release
        self.auth = auth

        self.image_packages = {}
        self.version = None
        self.github_release = None
        self.architectures = []

        self._init()

    def _init(self):
        for arch in known_architectures:
            if release_arch_exists(self.origin_server, self.channel, arch, self.release, auth=self.auth):
                self.architectures.append(arch)

        # Assume that versions are the same for each architecture of a release
        version = requests.get('{}/{}/{}-usr/{}/version.txt'.format(
            self.origin_server, self.channel, self.architectures[0], self.release), auth=self.auth)
        version.raise_for_status()
        for line in io.StringIO(version.text):
            match = re.search(r'^FLATCAR_VERSION=(\d+\.\d+\.\d+)$', line)
            if match:
                self.version = match.group(1)
                break

        licenses = requests.get('{}/{}/{}-usr/{}/flatcar_production_image_licenses.json'.format(  # noqa: E501
            self.origin_server, self.channel, self.architectures[0], self.release), auth=self.auth)
        licenses.raise_for_status()
        packages = {"sys-kernel/coreos-kernel": "kernel",
                    "app-containers/docker": "docker",
                    "app-containers/containerd": "containerd",
                    "sys-apps/systemd": "systemd",
                    "sys-apps/ignition": "ignition",
                    # legacy categories, remove after 3602 and older are gone
                    "app-emulation/docker": "docker",
                    "app-emulation/containerd": "containerd"}
        for project in json.loads(licenses.text):
            for pkg in packages.keys():
                ex = f"^{pkg}-([0-9.]+).*"
                m = re.search(ex, project["project"])
                if m:
                    version = m.group(1)
                    # we only track the systemd major release
                    if packages[pkg] == "systemd":
                        version = version.split(".", 1)[0]
                    self.image_packages[packages[pkg]] = version

        gh_user = os.environ.get('GH_USER')
        gh_token = os.environ.get('GH_TOKEN')
        auth = None
        if gh_user and gh_token:
            auth = (gh_user, gh_token)
        headers = {
            'Accept': 'application/vnd.github.v3+json'
        }
        release_url = 'https://api.github.com/repos/flatcar/scripts/releases/tags/{}-{}'.format(self.channel, self.version)  # noqa: E501
        github_release = requests.get(release_url, auth=auth, headers=headers)
        if github_release.status_code == 200:
            self.github_release = github_release.json()
        else:
            release_url = 'https://api.github.com/repos/flatcar/manifest/releases/tags/v{}'.format(self.version)  # noqa: E501
            github_release = requests.get(release_url, auth=auth, headers=headers)
            if github_release.status_code == 200:
                self.github_release = github_release.json()
            else:
                raise Exception('no github release info for {} (http status code {})'.format(
                    self.version, github_release.status_code))


def main(args):
    parser = OptionParser()
    parser.add_option('-c', '--channel', dest='channel', default='')
    parser.add_option('-r', '--releases', action='append', dest='releases')
    (options, args) = parser.parse_args()
    user = os.environ.get('LTS_USER')
    password = os.environ.get('LTS_PASSWORD')
    if user is None or password is None:
        auth = None
    else:
        auth = (user, password)
    if options.channel:
        channels = [options.channel]
    else:
        channels = ['stable', 'beta', 'alpha', 'edge', 'lts']
        lts_info = requests.get('https://lts.release.flatcar-linux.net/lts-info')
        lts_info.status_code.raise_for_status()
        for line in io.StringIO(lts_info.text):
            _, year, support = line.strip().split(':')
            if support != 'unsupported':
                channels += ['lts-' + year]
    for channel in channels:
        target_dirs = ['releases/{}/'.format(channel)]
        stream = None
        if channel.startswith('lts-'):
            stream = '-'.join(channel.split('-')[1:])
            channel = 'lts'
            target_dirs += ['releases/lts/']
            releases = list(options.releases)
            if not releases:
                raise Exception('No releases passed')
            if releases == ['current'] or releases == ['current-' + stream]:
                # make sure both keys are set
                releases = ['current', 'current-' + stream]
                # resolve 'current-STREAM''s version and append it to copied releases list
                releases.append(ReleaseInfo(channel=channel, release='current-' + stream, auth=auth).version)
        else:
            releases = list(options.releases) or Releases(channel=channel, auth=auth)
            if releases == ['current']:
                # resolve current version and append it to copied releases list
                releases.append(ReleaseInfo(channel=channel, release='current', auth=auth).version)
        for release in releases:
            # rewrite the symlink to lookup to be only 'current-STREAM' and never 'current' if a stream is set
            # (ensure that both keys will be set and have the same value)
            release_to_fetch = 'current-' + stream if stream and release == 'current' else release
            release_info = ReleaseInfo(channel=channel, release=release_to_fetch, auth=auth)
            data = {
                'channel': channel,
                'release': release,
                'version': release_info.version,
                'image_packages': release_info.image_packages,
                'github_release': release_info.github_release,
                'architectures': release_info.architectures,
            }
            for target_dir in target_dirs:
                if stream and target_dir == 'releases/lts/' and (release == 'current' or release == 'current' + stream):
                    # Do not write "lts/current..." files when called for "lts-STREAM"
                    continue
                os.makedirs(target_dir, exist_ok=True)
                with open('{}/{}.yml'.format(target_dir, release), 'w') as outfile:
                    yaml.dump(data, outfile, encoding='utf-8',
                              default_flow_style=False)


if __name__ == '__main__':
    main(sys.argv[1:])
