FROM --platform=linux/amd64 public.ecr.aws/docker/library/node:18-slim

# update packages
RUN apt-get update

# create root application folder
WORKDIR /

# copy configs to /app folder
COPY package.json /
COPY tsconfig.json /

COPY node_modules node_modules

COPY dist dist

RUN npm install typescript@4.9.3 -g

USER node

CMD [ "node", "./dist/src/index.js" ]
