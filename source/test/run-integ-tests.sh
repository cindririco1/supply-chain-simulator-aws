#!/bin/bash
#
# This script runs all integraation tests for the CDK project and Lambda functions.

# Configure environment variables
template_dir=$PWD
root_dir="${template_dir%/*}"

# TODO: Remove ADA configuration override while integrating with internal pipeline
configure_ada() {
  echo "Please login with midway"
  mwinit
  ada credentials update --account=$AWS_ACCOUNT_ID --provider=isengard --role=Admin --once --profile=$PROFILE
}

run_integration_test() {
  local component_path=$1
  local component_name=$2

  npm install jest -g

  echo "------------------------------------------------------------------------------"
  echo "[Test] Run Integration Test for component_name"
  echo "------------------------------------------------------------------------------"

  cd $component_path

  # Clean and install dependencies
  npm install --install-links=false

  # Run unit tests
  npm run test
}

configure_ada
run_integration_test $root_dir/test/plan-execution PlanExecution

if [ $? -eq 0 ]
then
  echo "Integration Test Passed for Plan Execution"
else
  echo "******************************************************************************"
  echo "Integration Test Passed Failed for Plan Execution"
  echo "******************************************************************************"
  exit 1
fi
