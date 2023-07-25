## Table of Content

-   [Before you begin](#before-you-begin)
-   [Build and Test](#build-and-test)

# Before you begin
- Install [Postman](https://www.postman.com/downloads/)
- Checkout [this video](https://amazon.awsapps.com/workdocs/index.html#/login?redirectPath=document%2Fd09ab8f2bda9f4a0ac637bcd29334087fd2d24da876a9acb16595a452e99a76e) to set up a Cognito user pool resources.
- Authenticate via Postman and fetch an `id_token`.
- Run `aws configure` to make sure you are picking up the correct region and profile (savant).

# Build and Test
- Change the current working directory

```
cd source/test
```
- Declare the environment variables
```
export AWS_ACCOUNT_ID=foobar
export REGION=us-east-1
export PROFILE=savant
export STACK_NAME=Savant
export USERNAME=foobar
export PASSWORD=foobar
```

- Run Eslint Check
```
npx eslint **/*.ts
```

- Run Integration Tests
```
./run-integ-tests.sh
```
