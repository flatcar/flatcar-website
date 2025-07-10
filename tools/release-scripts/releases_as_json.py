#!/usr/bin/env python3

import json
import sys
import yaml
from dateutil import parser

if len(sys.argv) == 1 or sys.argv[1] == '-h' or sys.argv[1] == '--help':
    print('Usage: ', sys.argv[0], 'YAMLFILES... > JSONFILE')
    print('Converts flatcar-website/data/releases/CHANNEL/*.yml files to')
    print('a single JSON file for')
    print('flatcar-website/static/releases-json/releases-CHANNEL.json')
    sys.exit()

all_releases = {}
for path in sys.argv[1:]:
    with open(path) as f:
        release = yaml.safe_load(f)
        obj = {}
        obj['channel'] = release['channel']
        obj['architectures'] = release['architectures']
        d = parser.parse(release['github_release']['published_at'])
        obj['release_date'] = d.strftime('%Y-%m-%d %H:%M:%S %z')
        packages = {k: [v] for (k, v) in release['image_packages'].items()}
        obj['major_software'] = packages
        notes = release['github_release']['body'].replace('\r', '')
        obj['release_notes'] = notes
        all_releases[release['release']] = obj

json.dump(all_releases, sys.stdout, indent=2)
print()
