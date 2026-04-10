#!/bin/bash
cd ~/projects/MySite
docker build -t ghcr.io/saketh1997/personal-site:latest .
docker push ghcr.io/saketh1997/personal-site:latest
KUBECONFIG=/home/hunter/.kube/config kubectl rollout restart deployment/personal-site
git add .
git commit -m "Update personal site"
git push origin main
echo "Done"

kubectl delete pod -l app=personal-site --field-selector=status.phase==Running
