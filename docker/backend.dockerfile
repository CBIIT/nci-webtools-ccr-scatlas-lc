FROM public.ecr.aws/amazonlinux/amazonlinux:2022

RUN dnf -y update \
 && dnf -y install \
    make \
    gcc-c++ \
    nodejs \
    npm \
 && dnf clean all

RUN mkdir -p /deploy/server

WORKDIR /deploy/server

# use build cache for npm packages
COPY server/package.json server/package-lock.json /deploy/server/

RUN npm install

# copy the rest of the application
COPY . /deploy/

CMD npm start
