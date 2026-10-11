import io
import importlib.util
import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

_spec = importlib.util.spec_from_file_location(
    "fcl_fetch_version_data",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "fcl-fetch-version-data.py"),
)
fcl = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(fcl)


class TestLatestVersion(unittest.TestCase):

    def test_returns_version_on_success(self):
        with mock.patch.object(fcl, 'fetch', return_value='FLATCAR_VERSION=3033.2.2\nFLATCAR_BUILD=2\n'):
            self.assertEqual(fcl.latestVersion('stable'), '3033.2.2')

    def test_returns_unreleased_on_404(self):
        err = fcl.HTTPError('https://stable.release.flatcar-linux.net/amd64-usr/current/version.txt', 404, 'Not Found', {}, None)
        with mock.patch.object(fcl, 'fetch', side_effect=err):
            self.assertEqual(fcl.latestVersion('stable'), 'unreleased')

    def test_propagates_non_404_http_error(self):
        err = fcl.HTTPError('https://stable.release.flatcar-linux.net/amd64-usr/current/version.txt', 500, 'Server Error', {}, None)
        with mock.patch.object(fcl, 'fetch', side_effect=err):
            with self.assertRaises(fcl.HTTPError):
                fcl.latestVersion('stable')

    def test_urlerror_raises_runtime_error(self):
        err = fcl.URLError('Name or service not known')
        with mock.patch.object(fcl, 'fetch', side_effect=err):
            with self.assertRaises(RuntimeError) as ctx:
                fcl.latestVersion('stable')
            self.assertIn('Name or service not known', str(ctx.exception))


class TestListAMIs(unittest.TestCase):

    def test_returns_amis_on_success(self):
        payload = '{"amis": [{"name": "ami-1", "hvm": true}]}'
        with mock.patch.object(fcl, 'fetch', return_value=payload):
            self.assertEqual(fcl.listAMIs('stable'), [{'name': 'ami-1', 'hvm': True}])

    def test_returns_empty_on_404(self):
        err = fcl.HTTPError('https://stable.release.flatcar-linux.net/amd64-usr/current/flatcar_production_ami_all.json', 404, 'Not Found', {}, None)
        with mock.patch.object(fcl, 'fetch', side_effect=err):
            self.assertEqual(fcl.listAMIs('stable'), [])

    def test_urlerror_raises_runtime_error(self):
        err = fcl.URLError('timed out')
        with mock.patch.object(fcl, 'fetch', side_effect=err):
            with self.assertRaises(RuntimeError) as ctx:
                fcl.listAMIs('stable')
            self.assertIn('timed out', str(ctx.exception))


if __name__ == '__main__':
    unittest.main()
