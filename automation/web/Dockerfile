############################################################
# Dockerfile to build Python WSGI Application Containers
# Based on Ubuntu
############################################################

# Set the base image to Ubuntu
FROM ubuntu:14.04

# File Author / Maintainer
MAINTAINER cackharot <cackharot@gmail.com>

# Update the sources list
RUN apt-get -y update

# Install required pacakges
RUN apt-get install -y curl git

# Create application directory
RUN mkdir -p /opt/fbeazt

RUN git clone https://github.com/cackharot/fbeazt.git /opt/fbeazt

WORKDIR /opt/fbeazt/src/web

VOLUME ["/opt/fbeazt"]

RUN curl -sL https://deb.nodesource.com/setup_6.x | bash

RUN apt-get install -y nodejs

# RUN update-alternatives --install /usr/bin/node node /usr/bin/nodejs 10

RUN cp package.json /tmp/package.json
RUN cd /tmp && npm install
RUN cp -a /tmp/node_modules /opt/fbeazt/src/web

# Expose http ports
EXPOSE 8080

RUN npm install http-server -g

RUN npm install 

# Set the default command to execute
# when creating a new container
CMD npm install && npm run build && http-server ./dist
# CMD ["http-server", "./dist"]