# ---- build stage: compile the React app (node/npm live here only) ----
FROM public.ecr.aws/amazonlinux/amazonlinux:2023 AS build

RUN dnf -y update \
 && dnf -y install \
    make \
    nodejs \
    npm \
 && dnf clean all

WORKDIR /deploy/client

# install pinned dependencies first for better layer caching
COPY client/package.json client/package-lock.json /deploy/client/

RUN npm ci

COPY client /deploy/client/

ARG REACT_APP_GTAG

ENV REACT_APP_GTAG=${REACT_APP_GTAG}

RUN npm run build

# ---- runtime stage: serve the static build with httpd (no node_modules) ----
FROM public.ecr.aws/amazonlinux/amazonlinux:2023

RUN dnf -y update \
 && dnf -y install \
    httpd \
 && dnf clean all

# copy only the compiled static assets from the build stage
COPY --from=build /deploy/client/build/ /var/www/html/

WORKDIR /var/www/html

RUN touch index.html

# Add custom httpd configuration
COPY docker/httpd-scatlaslc.conf /etc/httpd/conf.d/httpd-scatlaslc.conf

EXPOSE 80
EXPOSE 443

CMD rm -rf /run/httpd/* /tmp/httpd* \
 && exec /usr/sbin/httpd -DFOREGROUND
