#!/bin/bash

# Ledgr Backend Deployment Script
# Run this script to sync your local backend changes to the Oracle VM and restart the server.

SERVER="ubuntu@130.210.9.118"
SSH_KEY="C:\Users\hrida\Downloads\ssh-key-2026-08-23.key"
REMOTE_DIR="/home/ubuntu/ledgr/backend"

echo "🚀 Deploying backend to Oracle VM..."

# 1. Copy the entire backend directory (excluding pycache and venv) to the server
echo "📦 Syncing files via SCP..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -r \
  ./app \
  ./requirements.txt \
  $SERVER:$REMOTE_DIR/

# 2. Restart the systemd service on the server
echo "🔄 Restarting Ledgr service..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $SERVER "cd $REMOTE_DIR && sudo systemctl restart ledgr && sudo systemctl status ledgr --no-pager"

echo "✅ Deployment complete!"
