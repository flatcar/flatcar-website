#!/usr/bin/env python3

import importlib.util
import re
import sys
import unittest
from urllib.error import HTTPError

spec = importlib.util.spec_from_file_location('fcl_fetch_version_data',
        '/home/deepak-bhagat/Desktop/flatcar-website/tools/fcl-fetch-version-data.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def _fake_fetch(body):
    def fetch(url):
        return body
    return fetch


class LatestVersionTests(unittest.TestCase):
    def test_returns_version_on_match(self):
        m.fetch = _fake_fetch('FLATCAR_VERSION=3033.2.1\nCOREOS_VERSION=3033.2.1\n')
        self.assertEqual(m.latestVersion('stable'), '3033.2.1')

    def test_raises_on_missing_match(self):
        m.fetch = _fake_fetch('OTHER=123\nSOMETHING_ELSE=456\n')
        with self.assertRaises(RuntimeError):
            m.latestVersion('stable')

    def test_404_returns_unreleased(self):
        def fetch_404(url):
            raise HTTPError(url, 404, 'not found', {}, None)
        m.fetch = fetch_404
        self.assertEqual(m.latestVersion('stable'), 'unreleased')

    def test_non_404_reraises(self):
        def fetch_500(url):
            raise HTTPError(url, 500, 'server error', {}, None)
        m.fetch = fetch_500
        with self.assertRaises(HTTPError):
            m.latestVersion('stable')


if __name__ == '__main__':
    unittest.main()
