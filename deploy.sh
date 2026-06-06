#!/usr/bin/env bash
#
# NUVRA — UAT deploy script
# Pulls the latest `uat` branch onto the UAT VM, rebuilds the frontend,
# runs migrations, and clears caches.
#
# Why the GIT_SSH_COMMAND wrapper?
#   The repo is pulled via SSH (git@github.com). The GitHub deploy key lives
#   under the `abdulmuhaimin` user, but the deploy runs `git` as root via sudo,
#   and root has NO GitHub key. Plain `sudo git fetch` therefore fails with
#   "Permission denied (publickey)" and the server silently keeps old code.
#   We tell git (running as root) to use the user's key explicitly.
#
# Usage:
#   ./deploy.sh            # deploy code + rebuild (no reseed)
#   ./deploy.sh --seed     # also wipe & reseed dummy data (UAT only!)
#
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
VM_HOST="${NUVRA_VM_HOST:-abdulmuhaimin@34.142.226.77}"
APP_DIR="/var/www/html"
BRANCH="uat"
DEPLOY_KEY="/home/abdulmuhaimin/.ssh/id_ed25519"   # GitHub deploy key on the VM
GIT_SSH="ssh -i ${DEPLOY_KEY} -o StrictHostKeyChecking=no"

RESEED="false"
[[ "${1:-}" == "--seed" ]] && RESEED="true"

echo "🚀 Deploying '${BRANCH}' to ${VM_HOST} ..."

# shellcheck disable=SC2087
ssh -o StrictHostKeyChecking=no "${VM_HOST}" bash -s <<REMOTE
set -euo pipefail
cd "${APP_DIR}"

echo "── Fetching latest ${BRANCH} (using deploy key) ──"
sudo env GIT_SSH_COMMAND="${GIT_SSH}" git fetch origin "${BRANCH}"
sudo git reset --hard "origin/${BRANCH}"
echo "Now at: \$(git rev-parse --short HEAD)"

echo "── Installing deps + building frontend ──"
sudo npm install --no-audit --no-fund
sudo npm run build

echo "── Migrating + optimizing ──"
sudo php artisan migrate --force
sudo php artisan optimize

if [[ "${RESEED}" == "true" ]]; then
  echo "── Reseeding dummy data (UAT) ──"
  sudo php artisan db:seed --class=PlayerDummySeeder --force
fi

echo "✅ Deploy complete."
REMOTE

echo "🎉 Done. Live at http://34.142.226.77"
