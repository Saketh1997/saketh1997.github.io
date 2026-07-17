#!/bin/bash
cd ~/projects/MySite
docker build -t ghcr.io/saketh1997/personal-site:latest .
docker push ghcr.io/saketh1997/personal-site:latest
git add .
git commit -m "Adding chat bot"
git push origin main
echo "Done"

ssh hunter@100.106.106.104 "KUBECONFIG=/home/hunter/.kube/config kubectl rollout restart deployment/personal-site"
ssh hunter@100.106.106.104 "kubectl delete pod -l app=personal-site --field-selector=status.phase==Running"
