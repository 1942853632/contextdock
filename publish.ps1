$ErrorActionPreference = 'Stop'

# Git for Windows may fail during TLS credential initialization with SChannel.
git config --local http.sslbackend openssl

# Use a project-local credential store when Windows Credential Manager is unavailable.
git config --local credential.helper manager
git config --local credential.credentialStore plaintext

if (-not (git remote get-url origin 2>$null)) {
  git remote add origin 'https://github.com/1942853632/contextdock.git'
}

Write-Host 'Authenticate with GitHub when prompted. Never put a token in this script.'
git push -u origin main
