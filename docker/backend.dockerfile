FROM public.ecr.aws/amazonlinux/amazonlinux:2023

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

# duckdb needs only @mapbox/node-pre-gyp's .find() at runtime, not its download
# chain — drop socks/ip (CVE-2024-29415, no upstream fix) which are install-only.
RUN npm ci \
 && rm -rf node_modules/ip node_modules/socks node_modules/socks-proxy-agent

# copy the rest of the application
COPY server/ /deploy/server/

CMD npm start
