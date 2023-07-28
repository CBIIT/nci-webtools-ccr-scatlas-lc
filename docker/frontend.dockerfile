FROM public.ecr.aws/amazonlinux/amazonlinux:2022

RUN dnf -y update \
 && dnf -y install \
    httpd \
    make \
    nodejs \
    npm \
 && dnf clean all

RUN mkdir -p /deploy/client

WORKDIR /deploy/client

COPY client/package.json /deploy/client/

RUN npm install

COPY client /deploy/client/

ARG REACT_APP_GTAG

ENV REACT_APP_GTAG ${REACT_APP_GTAG}

RUN npm run build \
 && cp -r /deploy/client/build/. /var/www/html

WORKDIR /var/www/html

RUN touch index.html

# Add custom httpd configuration
COPY docker/httpd-scatlaslc.conf /etc/httpd/conf.d/httpd-scatlaslc.conf

EXPOSE 80
EXPOSE 443

CMD rm -rf /run/httpd/* /tmp/httpd* \
 && exec /usr/sbin/httpd -DFOREGROUND