#!/bin/bash

# This script checks linting rules for API specs by executing bob's rule.
#
# Usage:
# ./api-specs-check.sh <ruleset1,ruleset2,...> [list_of_local_paths]
#
# Arguments:
# - <ruleset1,ruleset2,...>: Coma-separated list of linting rulesets.
# - [list_of_local_paths]: List of specifications paths relative to the root of the project.

set -x

api_check_report_folder=".bob/api-linter-check/reports"
api_check_generated_report_path=".bob/api-linter-check/report-adp.html"

# Check if at least two arguments are provided
if [ $# -lt 1 ]; then
  echo "Error: <rulesets> is a required argument."
  exit 1
elif [ $# -lt 2 ]; then
  echo "Info: No specifications were provided for the API check."
  exit 0
fi

# Parsing comma-separated rulesets into a list
IFS="," read -r -a rulesets <<< "$1"
# Shift the first argument, so $@ contains the list of paths
shift

for specs_file in "$@"; do
  # This name is used when renaming the resulted report
  specs_name=$(basename "${specs_file}" .yaml | sed 's/\.spec//' | tr '.' '-')
  for ruleset in "${rulesets[@]}"; do
    # Executing linting with a bob rule and for a current ruleset
    bob lint-openapi-specs-file -p api-spec-path="${specs_file}" -p api-check-ruleset="${ruleset}"
    # If report was created then rename and move to 'report' folder.
    if [ -f "$api_check_generated_report_path" ]; then
      renamed_report_path="${api_check_report_folder}/report-adp-${ruleset}-${specs_name}.html"
      mv "$api_check_generated_report_path" "$renamed_report_path"
    else
      # If report doesn't exist then there were no report messages, specs successfully passed all DRs
      echo "Report ${ruleset} for ${specs_name} is empty, all DRs passed successfully!"
    fi
  done
done