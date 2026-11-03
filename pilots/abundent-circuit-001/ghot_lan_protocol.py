"""Circuit 003: opt-in, narrow HMAC integrity transport for a *trusted* LAN.

No bearer secret crosses the network; token is handed to the local operator.
This is NOT reLATTE cryptographic receipt verification, TLS, or a general GHoT
remote-execution API. Only GHoT's native allowlisted system.hash is exposed.
"""
from __future__ import annotations

import hashlib
import hmac
import ipaddress
import json
import re
import secrets
import time
import urllib.error
import urllib.request
from urllib.parse import urlsplit

SECRET_RE = re.compile(r'^[0-9a-f]{64}$')
NONCE_RE = re.compile(r'^[0-9a-f]{32}$')
HASH_RE = re.compile(r'^[0-9a-f]{64}$')
MAX_PAYLOAD = 2500
CLOCK_SKEW_SECONDS = 120


def key_from_string(value: str) -> bytes:
    if not isinstance(value, str) or not SECRET_RE.fullmatch(value):
        raise ValueError('Pairing key must be 64 lowercase hexadecimal characters.')
    return bytes.fromhex(value)


def make_key() -> str:
    return secrets.token_hex(32)


def digest(blob: bytes) -> str:
    return hashlib.sha256(blob).hexdigest()


def auth_mac(key: bytes, method: str, path: str, epoch: str, nonce: str, body: bytes) -> str:
    message = '\n'.join((method, path, epoch, nonce, digest(body))).encode('ascii')
    return hmac.new(key, message, hashlib.sha256).hexdigest()


def response_mac(key: bytes, path: str, nonce: str, body: bytes) -> str:
    message = '\n'.join(('RESPONSE', path, nonce, digest(body))).encode('ascii')
    return hmac.new(key, message, hashlib.sha256).hexdigest()


def validate_request(key: bytes, method: str, path: str, headers, body: bytes) -> str:
    epoch = headers.get('X-Circuit-Timestamp', '')
    nonce = headers.get('X-Circuit-Nonce', '')
    mac = headers.get('X-Circuit-Mac', '')
    if not (epoch.isascii() and epoch.isdecimal() and len(epoch) <= 12):
        raise ValueError('Missing or invalid signed timestamp.')
    if not NONCE_RE.fullmatch(nonce):
        raise ValueError('Missing or invalid signed nonce.')
    if not HASH_RE.fullmatch(mac):
        raise ValueError('Missing or invalid signature.')
    if abs(time.time() - int(epoch)) > CLOCK_SKEW_SECONDS:
        raise ValueError('Signed request expired or clock difference is too large.')
    expected = auth_mac(key, method, path, epoch, nonce, body)
    if not hmac.compare_digest(expected, mac):
        raise ValueError('Signed request rejected.')
    return nonce


def private_peer_url(value: str) -> str:
    """No DNS, redirects, public IPs, credentials, fragments or paths.

    Allow loopback for two-process *testing*; a real second host uses a private
    IPv4 literal on an operator-controlled LAN. DNS rebinding is excluded.
    """
    if not isinstance(value, str) or len(value) > 110:
        raise ValueError('Enter a short http://private-ip:port worker address.')
    parsed = urlsplit(value)
    if parsed.scheme != 'http' or parsed.username or parsed.password or parsed.path not in ('', '/') or parsed.query or parsed.fragment:
        raise ValueError('Expected http://private-ip:port with no other fields.')
    try:
        host = ipaddress.IPv4Address(parsed.hostname or '')
        port = parsed.port
    except (ipaddress.AddressValueError, ValueError) as exc:
        raise ValueError('Use a numeric private IPv4 address, not a hostname.') from exc
    if port is None or not 1024 <= port <= 65535:
        raise ValueError('Use an explicit port 1024–65535.')
    # RFC1918/loopback only; ipaddress.is_private alone accepts special ranges.
    ranges = [ipaddress.IPv4Network(x) for x in ('10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '127.0.0.0/8')]
    if not any(host in r for r in ranges):
        raise ValueError('Worker address must be private LAN or loopback test IP.')
    if host.is_multicast or host.is_unspecified or host.is_reserved:
        raise ValueError('Unsupported worker address.')
    return f'http://{host}:{port}'


def post_signed(url: str, key: bytes, path: str, payload: dict, *, timeout: float = 8.0) -> dict:
    base = private_peer_url(url)
    if path not in ('/v1/pair', '/v1/hash'):
        raise ValueError('Unsupported remote capability.')
    body = json.dumps(payload, ensure_ascii=False, separators=(',', ':'), sort_keys=True).encode('utf-8')
    if len(body) > MAX_PAYLOAD:
        raise ValueError('Request too large.')
    nonce = secrets.token_hex(16)
    epoch = str(int(time.time()))
    headers = {
        'Content-Type': 'application/json',
        'X-Circuit-Timestamp': epoch,
        'X-Circuit-Nonce': nonce,
        'X-Circuit-Mac': auth_mac(key, 'POST', path, epoch, nonce, body),
    }
    request = urllib.request.Request(base + path, body, headers, method='POST')
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), _NoRedirect())
    try:
        with opener.open(request, timeout=timeout) as res:
            if res.status != 200:
                raise RuntimeError(f'Worker rejected task (HTTP {res.status}).')
            response = res.read(MAX_PAYLOAD + 1000)
            signature = res.headers.get('X-Circuit-Response-Mac', '')
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f'Worker rejected task (HTTP {exc.code}).') from exc
    except (urllib.error.URLError, TimeoutError) as exc:
        raise RuntimeError('Worker unreachable; check LAN IP, firewall, and pairing.') from exc
    if len(response) > MAX_PAYLOAD + 500:
        raise RuntimeError('Worker response too large.')
    expected = response_mac(key, path, nonce, response)
    if not HASH_RE.fullmatch(signature) or not hmac.compare_digest(expected, signature):
        raise RuntimeError('Worker response integrity check failed.')
    result = json.loads(response)
    if not isinstance(result, dict) or result.get('requestNonce') != nonce:
        raise RuntimeError('Worker did not bind response to our request.')
    return result


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError('Redirects to other hosts are forbidden.')
