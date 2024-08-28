#!/bin/bash
set -e

AUTO_3PP_HANDLER_RULESET="ci/rulesets/auto-3pp-handler-rules.yaml"

for ref in $(cat .bob/var.3pp-refs)
do
  echo $ref > .bob/var.3pp-ref
  bob -r $AUTO_3PP_HANDLER_RULESET 3pp-handling-tasks
done