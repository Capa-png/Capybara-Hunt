#!/usr/bin/env python3
import http.server
import ssl
import os
import socket

os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Get local IP
hostname = socket.gethostname()
local_ip = socket.gethostbyname(hostname)

port = 8443
handler = http.server.SimpleHTTPRequestHandler

# Create SSL context with self-signed cert
context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
context.check_hostname = False

# Generate self-signed cert using subprocess (Windows friendly)
if not os.path.exists('server.pem'):
    print("📄 Creating self-signed certificate...")
    os.system('powershell -NoProfile -Command "& {$cert = New-SelfSignedCertificate -DnsName localhost -CertStoreLocation cert:\\LocalMachine\\My -NotAfter (Get-Date).AddDays(365); Export-PfxCertificate -Cert $cert -FilePath server.pfx -Password (ConvertTo-SecureString -String password -AsPlainText -Force)}"')
    if os.path.exists('server.pfx'):
        print("✓ Certificate created!")

# Try to load certificate if it exists
if os.path.exists('server.pem'):
    context.load_cert_chain('server.pem')
else:
    print("⚠️  Certificate not found. Using insecure connection.")

httpd = http.server.HTTPServer(('0.0.0.0', port), handler)
httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

print(f"\n{'='*50}")
print(f"🔒 HTTPS Server running!")
print(f"{'='*50}")
print(f"📱 Access from your iPhone:")
print(f"   https://192.168.100.150:{port}")
print(f"\n⚠️  iOS: Tap 'Visit Anyway' when prompted")
print(f"   (This is a self-signed certificate)")
print(f"\nPress Ctrl+C to stop\n")

try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\n✓ Server stopped")
    httpd.server_close()
