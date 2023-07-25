#!/bin/bash
#
# This script runs all unit tests for the CDK project and Lambda functions.
#
# The if/then blocks are for error handling. They will cause the script to stop executing if an error is thrown from the
# node process running the test case(s). Removing them or not using them for additional calls with result in the
# script continuing to execute despite an error being thrown.

[ "$DEBUG" == 'true' ] && set -x
set -e

# Configure environment variables
template_dir=$PWD
root_dir="${template_dir%/*}"
source_dir="$root_dir/source"
coverage_reports_top_path="$source_dir/coverage-reports"

prepare_jest_coverage_report() {
	local component_name=$1

    if [ ! -d "coverage" ]; then
        echo "ValidationError: Missing required directory coverage after running unit tests"
        exit 129
    fi

	# prepare coverage reports
    rm -fr coverage/lcov-report
    mkdir -p $coverage_reports_top_path/jest
    coverage_report_path=$coverage_reports_top_path/jest/$component_name
    rm -fr $coverage_report_path
    mkdir -p $coverage_report_path
    mv coverage $coverage_report_path
}

run_typescript_test() {
  local component_path=$1
	local component_name=$2

  echo "------------------------------------------------------------------------------"
  echo "[Test] Run javascript unit test with coverage for $component_path $component_name"
  echo "------------------------------------------------------------------------------"
  echo "cd $component_path"
  cd $component_path

  # clean and install dependencies
  npm install

  # run unit tests
  npm run test

  # prepare coverage reports
  prepare_jest_coverage_report $component_name
}

# TypeScript packages
declare -a packages=(
    "infrastructure"
    "app/supply-chain-simulator-calculation"
    "app/plan-execution"
    "app/supply-chain-simulator-event-generation"
    "shared/api"
    "shared/neptune"
    "website"
    "api/neptune-integrator"
    "infrastructure/lib/custom-resource-handlers/general-custom-resources"
)

for package in "${packages[@]}"
do
  if [ -d "$source_dir/lambda/$package" ]
  then
    run_typescript_test $source_dir/lambda/$package $package
  else
    run_typescript_test $source_dir/$package $package
  fi

  # Check the result of the test and exit if a failure is identified
  if [ $? -eq 0 ]
  then
    echo "Test for $package passed"
  else
    echo "******************************************************************************"
    echo "TypeScript test FAILED for $package"
    echo "******************************************************************************"
    exit 1
  fi
done

# Return to the source/ level
cd $source_dir
