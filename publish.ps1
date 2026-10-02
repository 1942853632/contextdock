$ErrorActionPreference = 'Stop'

# Git for Windows may fail during TLS credential initialization with SChannel.
git config --local http.sslbackend openssl

# Keep GitHub CLI credentials with this checkout instead of the restricted global
# config, and make Git ask gh for the token on every operation.
$env:GH_CONFIG_DIR = Join-Path $PSScriptRoot '.gh'
if (-not (Test-Path (Join-Path $env:GH_CONFIG_DIR 'hosts.yml'))) {
  throw "GitHub CLI is not authenticated for this project. Run: `$env:GH_CONFIG_DIR='$env:GH_CONFIG_DIR'; gh auth login -h github.com --web"
}
git config --local --unset-all credential.helper 2>$null
git config --local --add credential.helper ''
git config --local --add credential.helper '!gh auth git-credential'

if (-not (git remote get-url origin 2>$null)) {
  git remote add origin 'https://github.com/1942853632/contextdock.git'
}

Write-Host 'Authenticate with GitHub when prompted. Never put a token in this script.'
git push -u origin main
