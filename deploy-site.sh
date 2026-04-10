#!/bin/bash
cd ~/projects/MySite
docker build -t personal-site:latest .
docker save personal-site:latest | sudo k3s ctr images import -
KUBECONFIG=/home/hunter/.kube/config kubectl rollout restart deployment/personal-site
echo "Done building image"

git add .
git commit -m "Update to personal site"
git push origin main
echo "Done pushing to repo"
