#!/bin/env python3
#
# This script will read a given markdown file's front-matter (see Hugo's definition for context)
# and fetch the external docs repos defined in there.
#

import os
import yaml
import subprocess
import sys

from yaml import load, dump
try:
    from yaml import CLoader as Loader, CDumper as Dumper
except ImportError:
    from yaml import Loader, Dumper

TOP_DIR_PATH = os.path.realpath(os.path.join(os.path.dirname(os.path.realpath(__file__)), '..'))

YAML_FRONT_MATTER_DELIM = '---'
EXTERNAL_REPOS_DIR = 'external-docs'

def get_external_docs_config(file_path):
    contents = []
    with open(file_path, 'r') as f:
        contents = f.read()

    config_yaml = yaml.load(contents, Loader=Loader)

    external_docs = config_yaml.get('params', {}).get('docs', {}).get('external_docs', [])
    return external_docs

def clone_repo(repo_url, name, branch):
    repo_name = os.path.basename(repo_url) + '_' + branch.replace('/', '_') + name
    repo_path = os.path.join(TOP_DIR_PATH, EXTERNAL_REPOS_DIR, repo_name)
    if not os.path.isdir(repo_path):
        subprocess.run(['git', 'clone', '--depth=1', '--branch={}'.format(branch), repo_url, repo_path])
    else:
        # If the repo exists and there are no local changes, then update it so we get the docs up
        # to date.
        try:
            subprocess.check_output(['git', '-C', repo_path, 'diff', '--quiet', 'HEAD'])
        except subprocess.CalledProcessError as e:
            print('Repo "{}" has local changes. Not updating: {}'.format(repo_path, e))
        else:
            subprocess.run(['git', '-C', repo_path, 'pull', '--no-rebase'])
    return repo_name

def fetch_docs(file_path):
    dir_name = ''#os.path.basename(os.path.dirname(file_path))

    external_docs = get_external_docs_config(file_path)

    if not external_docs:
        print('Warning: No external docs in', file_path)
        exit(0)

    for docs in external_docs:
        repo_name = clone_repo(docs['repo'], docs['name'], docs['branch'])
        docs['repo_name'] = repo_name
        docs['file'] = file_path

        link_external_docs(os.path.join(repo_name, docs['dir']), os.path.join(dir_name, docs['name']))

def link_external_docs(linked_dir, link_name):
    src_dir = os.path.join('..', '..', EXTERNAL_REPOS_DIR, linked_dir)
    dst_dir = os.path.join(TOP_DIR_PATH, 'content', 'docs', link_name)

    if os.path.exists(dst_dir):
        if os.path.islink(dst_dir) and os.readlink(dst_dir) == src_dir:
            # All is good, we already have the desired link
            return

        print('File exists when trying to create link', dst_dir)
        return

    os.symlink(src_dir, dst_dir)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Please pass a file path to it.')
        exit(-1)

    fetch_docs(sys.argv[1])
