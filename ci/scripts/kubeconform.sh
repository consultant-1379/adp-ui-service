#!/bin/bash
# This script is inspired by https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/OSS/com.ericsson.oss.air/ericsson-core-assurance/+/master/ci/kubernetes_range_checkers/kubeconform.sh
set -o nounset
set -o errexit
VERSIONS_TO_CHECK=$1
PATH_TO_READ_HELM_TEMPLATES_FROM=$2
SKIP_KINDS="${3-}"

for supported_version in $(echo $VERSIONS_TO_CHECK | sed "s/,/ /g")
do
    echo "Running kubeconform against kubernetes version $supported_version"
    set +o errexit
    OUTPUT=$(kubeconform -verbose -summary -skip "${SKIP_KINDS}" -kubernetes-version "$supported_version" -schema-location https://arm.seli.gic.ericsson.se/artifactory/proj-ecm-k8s-schema-generic-local --strict "${PATH_TO_READ_HELM_TEMPLATES_FROM}")
    EXIT_CODE=$?
    set -o errexit
    # Filter out invalid warning caused by issues in the checker scripts that need to be fixed in IDUN-10041
    OUTPUT=$(echo "$OUTPUT" | grep -v 'contains an invalid PodDisruptionBudget - apiVersion: apiVersion must be one of the following: "policy/v1beta1')
    # Filter out the warnings about the skipped kinds
    for kind in ${SKIP_KINDS//,/ }
    do
        echo "Filtering out warnings for kind $kind"
        OUTPUT=$(echo "$OUTPUT" | grep -v "${kind} was not validated against a schema")
    done
    echo "${OUTPUT}"
    if [[ $EXIT_CODE -ne 0 ]]
    then
        set +o errexit
        PASS_COUNT=$(echo "$OUTPUT" | grep -c "is valid")
        FAIL_COUNT=$(echo "$OUTPUT" | grep -c "is invalid")
        WARN_COUNT=$(echo "$OUTPUT" | grep -c "could not find schema")
        set -o errexit
        echo "Passed: $PASS_COUNT"
        echo "Failures: $FAIL_COUNT"
        echo "Warnings: $WARN_COUNT"
        if (( FAIL_COUNT > 0 )) || (( WARN_COUNT > 0 )) || (( PASS_COUNT == 0 ))
        then
            echo "kubeconform failed against kubernetes version $supported_version"
            exit 1
        else
            echo "kubeconform passed against kubernetes version $supported_version"
        fi
    else
        echo "kubeconform passed against kubernetes version $supported_version"
    fi
done
