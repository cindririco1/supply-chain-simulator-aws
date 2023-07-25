#!/bin/bash
#
# This assumes all of the OS-level configuration has been completed and git repo has already been cloned
#
# This script should be run from the repo's deployment directory
# cd deployment
# ./build-s3-dist.sh source-bucket-base-name solution-name version-code
#
# Paramenters:
#  - source-bucket-base-name: Name for the S3 bucket location where the template will source the Lambda
#    code from. The template will append '-[region_name]' to this bucket name.
#    For example: ./build-s3-dist.sh solutions my-solution v1.0.0
#    The template will then expect the source code to be located in the solutions-[region_name] bucket
#  - solution-name: name of the solution for consistency
#  - version-code: version of the package

# setting debug on and setting it to fail on any failed commands
[ "$DEBUG" == 'true' ] && set -x
set -e

# Check to see if input has been provided:
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
  echo "# Please provide all required parameters for the build script."
  echo "For example: ./build-s3-dist.sh bucket-prefix solution-name v1.0.0 us-east-1"
  exit 1
fi

# Build source
template_dir="$PWD"
template_dist_dir="$template_dir/global-s3-assets"
build_dist_dir="$template_dir/regional-s3-assets"
ecr_dir="$template_dir/ecr"
source_dir="$template_dir/../source"
shared_source_dir="$source_dir/shared"
neptune_integrator_source_dir="$source_dir/api/neptune-integrator"
app_source_dir="$source_dir/app"
root_dir="${template_dir%/*}"

echo "------------------------------------------------------------------------------"
echo "Starting build for Supply Chain Simulator on AWS"

echo "------------------------------------------------------------------------------"

echo "------------------------------------------------------------------------------"
echo "Clean up old build files"
echo "------------------------------------------------------------------------------"
echo "rm -rf $template_dist_dir"
rm -rf $template_dist_dir
echo "mkdir -p $template_dist_dir"
mkdir -p $template_dist_dir
echo "rm -rf $ecr_dir"
rm -rf $ecr_dir
echo "mkdir -p $ecr_dir"
mkdir -p $ecr_dir
echo "rm -rf $build_dist_dir"
rm -rf $build_dist_dir
echo "mkdir -p $build_dist_dir"
mkdir -p $build_dist_dir
echo "rm -rf $source_dir/infrastructure/cdk.out"
rm -rf $source_dir/infrastructure/cdk.out
echo "rm -rf $source_dir/infrastructure/node_modules"
rm -rf $source_dir/infrastructure/node_modules
echo "rm -rf $source_dir/infrastructure/lib/custom-resource-handlers/general-custom-resources/node_modules"
rm -rf $source_dir/infrastructure/node_modules
echo "rm -rf $shared_source_dir/node_modules"
rm -rf $shared_source_dir/node_modules
echo "rm -rf $shared_source_dir/api/node_modules"
rm -rf $shared_source_dir/api/node_modules
echo "rm -rf $shared_source_dir/neptune/node_modules"
rm -rf $shared_source_dir/neptune/node_modules
echo "rm -rf $shared_source_dir/util/node_modules"
rm -rf $shared_source_dir/util/node_modules
echo "rm -rf $neptune_integrator_source_dir/node_modules"
rm -rf $neptune_integrator_source_dir/node_modules
echo "rm -rf $app_source_dir/supply-chain-simulator-calculation/node_modules"
rm -rf $app_source_dir/supply-chain-simulator-calculation/node_modules
echo "rm -rf $app_source_dir/supply-chain-simulator-event-generation/node_modules"
rm -rf $app_source_dir/supply-chain-simulator-event-generation/node_modules

npm install typescript -g

npm install aws-cdk@2.88.0 -g --force


echo "------------------------------------------------------------------------------"
echo "Run Shared Build"
echo "------------------------------------------------------------------------------"

cd $shared_source_dir
npm install && npm run build

if [ $? -eq 0 ]
then
echo "Shared build succeeded"
else
echo "******************************************************************************"
echo "Shared build FAILED"
echo "******************************************************************************"
exit 1
fi


echo "------------------------------------------------------------------------------"
echo "Run Supply Chain Simulator on AWS Infrastructure Build"
echo "------------------------------------------------------------------------------"
cd $source_dir/infrastructure
npm i
npm run build

if [ $? -eq 0 ]
then
  echo "Supply Chain Simulator on AWS Infrastructure build succeeded"
else
  echo "******************************************************************************"
  echo "Supply Chain Simulator on AWS Infrastructure build FAILED"
  echo "******************************************************************************"
  exit 1
fi


echo "------------------------------------------------------------------------------"
echo "Run Supply Chain Simulator on AWS Infrastructure ESLint and prettier"
echo "------------------------------------------------------------------------------"
cd $source_dir/infrastructure
npx eslint .

if [ $? -eq 0 ]
then
  echo "Supply Chain Simulator on AWS Infrastructure TypeScript source codes are linted."
else
  echo "******************************************************************************"
  echo "Supply Chain Simulator on AWS Infrastructure ESLint and prettier FAILED"
  echo "******************************************************************************"
  exit 1
fi


echo "------------------------------------------------------------------------------"
echo "Synth CDK Template"
echo "------------------------------------------------------------------------------"
export BUCKET_NAME_PLACEHOLDER=$1
export SOLUTION_NAME_PLACEHOLDER=$2
export VERSION_PLACEHOLDER=$3
export overrideWarningsEnabled=false

if [ "$USE_SMALL_DATABASE" == "true" ]; then export DATABASE_INSTANCE_SIZE=db.t3.medium; else export DATABASE_INSTANCE_SIZE=LargerSizeStub; fi

cd $source_dir/infrastructure
node_modules/aws-cdk/bin/cdk synth --asset-metadata false --path-metadata false -c "VpcCIDR=10.1.0.0/16" -c "DatabasePort=8182" -c "DatabaseSize=$DATABASE_INSTANCE_SIZE" > $template_dist_dir/supply-chain-simulator-on-aws.template

if [ $? -ne 0 ]
then
  echo "******************************************************************************"
  echo "cdk-nag found errors"
  echo "******************************************************************************"
    exit 1
fi


echo "------------------------------------------------------------------------------"
echo "Run UI Builds"
echo "------------------------------------------------------------------------------"

cd "$source_dir/website/" || exit 1
npm install -g react-scripts
npm install
GENERATE_SOURCEMAP=false INLINE_RUNTIME_CHUNK=false npm run build

if [ $? -eq 0 ]
then
echo "UI build succeeded"
else
echo "******************************************************************************"
echo "UI build FAILED"
echo "******************************************************************************"
exit 1
fi
mkdir -p "$build_dist_dir"/website/
cp -r ./build/* "$build_dist_dir"/website/


echo "------------------------------------------------------------------------------"
echo "Generate website manifest file"
echo "------------------------------------------------------------------------------"
# This manifest file contains a list of all the website files. It is necessary in
# order to use the least privileges for deploying the UI.
#
# Details: The ui_copy_assets.py Lambda function needs this list in order to copy
# files from $build_dist_dir/website to the CloudFront S3 bucket.
# Since the manifest file is computed during build time, the ui_copy_assets.py Lambda
# can use that to figure out what files to copy instead of doing a list bucket operation,
# which would require ListBucket permission.
# Furthermore, the S3 bucket used to host AWS solutions disallows ListBucket
# access, so the only way to copy the website files from that bucket from
# to CloudFront S3 bucket is to use a manifest file.

cd $build_dist_dir"/website/" || exit 1
manifest=(`find . -type f | sed 's|^./||'`)
manifest_json=$(IFS=,;printf "%s" "${manifest[*]}")
echo "[\"$manifest_json\"]" | sed 's/,/","/g' > "$source_dir/infrastructure/lib/custom-resource-handlers/ui-manifest.json"
cat "$source_dir/infrastructure/lib/custom-resource-handlers/ui-manifest.json"

echo "------------------------------------------------------------------------------"
echo "Build Custom Resource helper function"
echo "------------------------------------------------------------------------------"

echo "Building Typescript General Custom Resources"
cd $source_dir/infrastructure/lib/custom-resource-handlers/general-custom-resources
npm install
npm run build

echo "Zipping Custom Resource handlers"
cd $source_dir/infrastructure/lib/custom-resource-handlers
zip -q -r $build_dist_dir/custom-resource-handlers.zip ./

echo "------------------------------------------------------------------------------"
echo "Run UI ESLint and prettier"
echo "------------------------------------------------------------------------------"

cd $source_dir/website
npm install
npx eslint **/*.ts

if [ $? -eq 0 ]
then
  echo "UI ESLint and prettier ESLint and prettier build succeeded"
else
  echo "******************************************************************************"
  echo "UI ESLint and prettier ESLint and prettier build FAILED"
  echo "******************************************************************************"
  exit 1
fi

echo "------------------------------------------------------------------------------"
echo "Run Neptune Integrator Builds"
echo "------------------------------------------------------------------------------"
cd $neptune_integrator_source_dir
npm install --install-links=true && npm run build

if [ $? -eq 0 ]
then
  echo "Neptune Integrator build succeeded"
else
  echo "******************************************************************************"
  echo "Neptune Integrator build FAILED"
  echo "******************************************************************************"
  exit 1
fi

echo "Zipping Neptune Integrator source code"
cd $neptune_integrator_source_dir
zip -q -r $build_dist_dir/neptune-integrator.zip ./

echo "------------------------------------------------------------------------------"
echo "Run Api ESLint and prettier"
echo "------------------------------------------------------------------------------"

cd $source_dir/api/neptune-integrator
npm install
npx eslint **/*.ts

if [ $? -eq 0 ]
then
  echo "Api ESLint and prettier build succeeded"
else
  echo "******************************************************************************"
  echo "Api ESLint and prettier build FAILED"
  echo "******************************************************************************"
  exit 1
fi

echo "------------------------------------------------------------------------------"
echo "Run Application Logic Builds"
echo "------------------------------------------------------------------------------"

cd $source_dir/app/supply-chain-simulator-calculation
npm i --install-links=true && npm run build && docker build . -t calculationservice

if [ $? -eq 0 ]
then
  cp -r $source_dir/app/supply-chain-simulator-calculation $ecr_dir/
  echo "Supply Chain Simulator on AWS Application Calculation Service build succeeded"
else
  echo "******************************************************************************"
  echo "Supply Chain Simulator on AWS Application Calculation Service build FAILED"
  echo "******************************************************************************"
  exit 1
fi

cd $source_dir/app/supply-chain-simulator-event-generation
npm i --install-links=true && npm run build && docker build . -t eventgeneration

if [ $? -eq 0 ]
then
  mkdir $ecr_dir/supply-chain-simulator-event-generation
  cp -r $source_dir/app/supply-chain-simulator-event-generation $ecr_dir/
  echo "Supply Chain Simulator on AWS Application Stream Poller build succeeded"
else
  echo "******************************************************************************"
  echo "Supply Chain Simulator on AWS Application Stream Poller build FAILED"
  echo "******************************************************************************"
  exit 1
fi

cd $source_dir/app/plan-execution
npm run build

if [ $? -eq 0 ]
then
  echo "Supply Chain Simulator on AWS Application Plan Execution build succeeded"
else
  echo "******************************************************************************"
  echo "Supply Chain Simulator on AWS Application Plan Execution build FAILED"
  echo "******************************************************************************"
  exit 1
fi

mv $source_dir/app/plan-execution/dist/plan-execution.zip $build_dist_dir/plan-execution.zip

echo "------------------------------------------------------------------------------"
echo "Run Application Logic ESLint and prettier"
echo "------------------------------------------------------------------------------"

cd $source_dir/app/supply-chain-simulator-calculation
npm install
cd $source_dir/app/supply-chain-simulator-calculation/src
npx eslint **/*.ts

if [ $? -eq 0 ]
then
  echo "Savant Application Calculation ESLint and prettier build succeeded"
else
  echo "******************************************************************************"
  echo "Savant Application Calculation ESLint and prettier build FAILED"
  echo "******************************************************************************"
  exit 1
fi

cd $source_dir/app/supply-chain-simulator-event-generation
npm install
cd $source_dir/app/supply-chain-simulator-event-generation/src
npx eslint **/*.ts

if [ $? -eq 0 ]
then
  echo "Supply Chain Simulator on AWS Application Stream Poller ESLint and prettier build succeeded"
else
  echo "******************************************************************************"
  echo "Supply Chain Simulator on AWS Application Stream Poller ESLint and prettier build FAILED"
  echo "******************************************************************************"
  exit 1
fi

cd $source_dir/app/plan-execution
npm install
cd $source_dir/app/plan-execution
npx eslint **/*.ts

if [ $? -eq 0 ]
then
  echo "Supply Chain Simulator on AWS Application Plan Execution ESLint and prettier build succeeded"
else
  echo "******************************************************************************"
  echo "Supply Chain Simulator on AWS Application Plan Execution ESLint and prettier build FAILED"
  echo "******************************************************************************"
  exit 1
fi


# removing files from builds that confuse Sonarqube (exclusions were not working)
echo "Removing .js and .d.ts from non-artifact files"
cd "$source_dir"
find . -type f -name '*.js' -not -name '*resolver.js' -not -name '*jest.config.js' -not -name '*.eslintrc.js' -not -path '*/node_modules/*.js' -not -path '*/coverage/*.js' -delete
find . -type f -name '*.d.ts' -not -path '*/node_modules/*.d.ts' -not -path '*/coverage/*.d.ts' -delete

cd "$template_dir"

echo "------------------------------------------------------------------------------"
echo "Supply Chain Simulator on AWS build succeeded!"
echo "------------------------------------------------------------------------------"
echo "•.,.,.•*'•.,~~,.•*¯ ╭━━━━━━━━━━━━━━━━━╮  "
echo "•.,.,.•*¯'•.,~,.•*¯.|:::::::::: /\____/\ "
echo "•.,.,.•*¯'•.,~,.•\*<|::::::::::(｡ ● ω ●｡) "
echo "•.,.,.•¯•.,.,.•╰ * >し----------し-----J  "
