#!/bin/bash

# Fix Unix socket permissions for Caddy access
set -e

echo "🔧 Fixing Unix socket permissions for Caddy..."

# Ensure the socket directory exists and has proper permissions
sudo mkdir -p /var/run/website

# Set group ownership to caddy and set setgid bit
sudo chgrp caddy /var/run/website
sudo chmod 2775 /var/run/website

# If socket already exists, fix its permissions
if [ -S /var/run/website/astro.sock ]; then
    echo "📋 Socket exists, fixing permissions..."
    sudo chgrp caddy /var/run/website/astro.sock
    sudo chmod 660 /var/run/website/astro.sock
    echo "✅ Socket permissions fixed"
else
    echo "⚠️  Socket not found yet, will be created by container with correct permissions"
fi

# Verify permissions
echo "🔍 Current permissions:"
ls -la /var/run/website/ 2>/dev/null || echo "Directory not accessible"

echo "✅ Socket permission setup complete!"
echo "💡 The setgid bit (2775) ensures new sockets inherit the caddy group"
