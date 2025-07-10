#!/usr/bin/env python3

import os
import sys
import yaml
from dateutil import parser
from feedgen.feed import FeedGenerator
from lxml.etree import CDATA
from markdown_it import MarkdownIt

if len(sys.argv) == 1 or sys.argv[1] == '-h' or sys.argv[1] == '--help':
    print('Usage: ', sys.argv[0], 'YAMLFILES... > JSONFILE')
    print('Converts flatcar-website/data/releases/CHANNEL/*.yml files to')
    print('a single RSS feed file for')
    print('flatcar-website/static/releases-feed/releases-CHANNEL.xml')
    sys.exit()

md = MarkdownIt('commonmark')

fg = FeedGenerator()
fg.id('https://www.flatcar.org/')
fg.title('Flatcar')
fg.author( {'name':'Flatcar Container Linux','email':'maintainers@flatcar-linux.org'} )
fg.link( href='https://www.flatcar.org/', rel='self')
fg.logo('https://www.flatcar.org/media/brand-logo.svg')
fg.subtitle('Flatcar Container Linux release feed')
fg.language('en')

channel = ''
versions_seen = []
all_feed = os.getenv('FEED')

for path in sys.argv[1:]:
    with open(path) as f:
        release = yaml.safe_load(f)

        if release['version'] in versions_seen:
            continue
        else:
            versions_seen.append(release['version'])

        channel = release['channel']

        fe = fg.add_entry()
        fe.id(release['github_release']['html_url'])
        fe.title(release['version'])
        fe.link(href='https://www.flatcar.org/releases/#release-'+release['version'], rel='self')

        d = parser.parse(release['github_release']['published_at'])
        fe.pubDate(d)

        notes = release['github_release']['body']
        style = '####' if '####' in notes else ''

        notes += f'\n\n{style} Packages:\n'
        for (k, v) in release['image_packages'].items():
            notes += f'- {k} {v}\n'

        notes += f'\n{style} Architectures:\n'
        for a in release['architectures']:
            notes += f'- {a}\n'

        fe.content(content=CDATA(md.render(notes)), type='html')

if channel != '' and all_feed == None:
    fg.title('%s :: %s' % (fg.title(), channel))
else:
    fg.title(fg.title())

print(fg.atom_str(pretty=True).decode())

# vim:set sts=4 sw=4 et:
