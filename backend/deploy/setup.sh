#!/bin/bash
set -e

echo "Starting Ledgr Backend Setup..."

# Update and install dependencies
sudo apt update
sudo apt install -y software-properties-common wget build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libsqlite3-dev libreadline-dev libffi-dev curl libbz2-dev sqlite3

if ! command -v python3.11 &> /dev/null; then
    echo "Python 3.11 not found. Compiling from source (this may take a few minutes)..."
    cd /tmp
    wget https://www.python.org/ftp/python/3.11.9/Python-3.11.9.tgz
    tar -xf Python-3.11.9.tgz
    cd Python-3.11.9
    ./configure --enable-optimizations
    sudo make altinstall
    cd ~
fi

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
