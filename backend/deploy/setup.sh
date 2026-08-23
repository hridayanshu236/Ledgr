#!/bin/bash
set -e

echo "Starting Ledgr Backend Setup..."

# Update and install dependencies
sudo apt update
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip sqlite3 build-essential

# Create project directory
mkdir -p /home/ubuntu/ledgr/backend
cd /home/ubuntu/ledgr/backend

# Setup Virtual Environment
if [ ! -d ".venv" ]; then
    python3.11 -m venv .venv
fi

# Install python dependencies
source .venv/bin/activate
pip install -r requirements.txt

# Setup systemd service
sudo cp deploy/ledgr.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ledgr
sudo systemctl restart ledgr

echo "Setup Complete! Backend should now be running on port 8000."
echo "Check status with: sudo systemctl status ledgr"
