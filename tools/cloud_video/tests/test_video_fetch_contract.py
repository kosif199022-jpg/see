"""Regression tests: KOSIF C public URL validation, no live downloads."""
import importlib.util
import pathlib
import socket
import unittest
from unittest.mock import patch

SCRIPT=pathlib.Path(__file__).resolve().parents[1]/"fetch.py"
spec=importlib.util.spec_from_file_location("kosif_video_fetch",SCRIPT)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

def fake_public_dns(*args,**kwargs):
    return [(socket.AF_INET,socket.SOCK_STREAM,6,'',('1.1.1.1',443))]

def fake_private_dns(*args,**kwargs):
    return [(socket.AF_INET,socket.SOCK_STREAM,6,'',('127.0.0.1',443))]

class URLSecurityTests(unittest.TestCase):
    @patch.object(mod.socket,'getaddrinfo',side_effect=fake_public_dns)
    def test_public_https_tiktok(self,_):
        self.assertEqual(mod.check_public_url('https://vt.tiktok.com/ZSbGDAh1n/'),'https://vt.tiktok.com/ZSbGDAh1n/')
    @patch.object(mod.socket,'getaddrinfo',side_effect=fake_private_dns)
    def test_private_dns_block(self,_):
        with self.assertRaises(ValueError):mod.check_public_url('https://example.com/vid')
    @patch.object(mod.socket,'getaddrinfo',side_effect=fake_public_dns)
    def test_reject_login_custom_port_and_non_https(self,_):
        for u in ('http://example.com/video.mp4','https://user:pass@example.com/video',
                  'https://example.com:8443/video.mp4','file:///etc/passwd',
                  'https://localhost/video.mp4','https://something.internal/video.mp4'):
            with self.subTest(u=u),self.assertRaises(ValueError):mod.check_public_url(u)
    def test_reject_blank_or_whitespace(self):
        for u in ('','\nhttps://example.com/video',' https://example.com'):
            with self.subTest(u=u),self.assertRaises(ValueError):mod.check_public_url(u)

if __name__=='__main__':unittest.main()
