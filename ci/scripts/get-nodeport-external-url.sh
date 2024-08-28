#!/bin/bash

while getopts n:s: flag
do
    case "${flag}" in
        n) NAMESPACE=${OPTARG};;
        s) SERVICE_NAME=${OPTARG};;
        *) echo "Invalid flag ${flag}"
    esac
done

if [ "$NAMESPACE" != "" ] && [ "$SERVICE_NAME" != "" ]

then
WORKER_NODE=$(kubectl get node -n "$NAMESPACE" -o jsonpath='{.items[?(@.metadata.labels.node-role\.kubernetes\.io/worker == "worker")].metadata.name}' | cut -d" " -f1)
NODEPORT=$(kubectl get svc "$SERVICE_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.ports[0].nodePort}' | cut -d" " -f1)
echo -n "$WORKER_NODE:$NODEPORT"

else
  echo 'Invalid namespace and servicename input'
  exit 1
fi