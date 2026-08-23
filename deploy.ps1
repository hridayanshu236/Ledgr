param (
    [Parameter(Mandatory=$true)][string]$IpAddress,
    [Parameter(Mandatory=$true)][string]$KeyPath
)

Write-Host "Deploying Ledgr Backend to Oracle VM..." -ForegroundColor Cyan

# Create backend directory structure on server
ssh -i $KeyPath -o StrictHostKeyChecking=no ubuntu@$IpAddress "mkdir -p /home/ubuntu/ledgr/backend/app /home/ubuntu/ledgr/backend/deploy"

# Copy files over SCP
Write-Host "Copying files..."
scp -i $KeyPath -o StrictHostKeyChecking=no -r .\backend\app ubuntu@${IpAddress}:/home/ubuntu/ledgr/backend/
scp -i $KeyPath -o StrictHostKeyChecking=no -r .\backend\deploy ubuntu@${IpAddress}:/home/ubuntu/ledgr/backend/
scp -i $KeyPath -o StrictHostKeyChecking=no .\backend\requirements.txt ubuntu@${IpAddress}:/home/ubuntu/ledgr/backend/
scp -i $KeyPath -o StrictHostKeyChecking=no .\backend\.env ubuntu@${IpAddress}:/home/ubuntu/ledgr/backend/

# Run setup and restart service
Write-Host "Running setup on server..."
ssh -i $KeyPath -o StrictHostKeyChecking=no ubuntu@$IpAddress "chmod +x /home/ubuntu/ledgr/backend/deploy/setup.sh && /home/ubuntu/ledgr/backend/deploy/setup.sh"

Write-Host "Deployment Complete!" -ForegroundColor Green
