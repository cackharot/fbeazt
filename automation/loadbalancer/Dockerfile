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

# Install Python and Basic Python Tools
RUN apt-get install -y nginx && \
  rm -rf /var/lib/apt/lists/* && \
  echo "\ndaemon off;" >> /etc/nginx/nginx.conf && \
  chown -R www-data:www-data /var/lib/nginx

EXPOSE 80
EXPOSE 8080
EXPOSE 433

# Define mountable directories.
VOLUME ["/etc/nginx/sites-enabled", "/etc/nginx/certs", "/etc/nginx/conf.d", "/var/log/nginx", "/var/www/html"]

COPY ./config /etc/nginx/sites-enabled

# Define working directory.
WORKDIR /etc/nginx

# Define default command.
CMD ["nginx"]