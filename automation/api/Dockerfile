############################################################
# Dockerfile to build Python WSGI Application Containers
# Based on Ubuntu
############################################################

# Set the base image to Alpine
#FROM ubuntu:14.04
FROM alpine:edge

# File Author / Maintainer
MAINTAINER cackharot <cackharot@gmail.com>

# Install Python and Basic Python Tools
RUN apk add --update python3 python3-dev py2-pip curl

RUN apk add --update gcc

RUN apk add --update alpine-sdk linux-headers python-dev

# Create application directory
RUN mkdir -p /opt/fbeazt

ADD ./ /opt/fbeazt

# Get pip to download and install requirements:
RUN python3 -m ensurepip && pip3 install -r /opt/fbeazt/src/foodbeazt/requirements.txt

# Expose http ports
EXPOSE 4000

# Set the default directory where CMD will execute
WORKDIR /opt/fbeazt

COPY ./automation/api/config/uwsgi/fbeazt_vasal.yml /etc/uwsgi/sites-enabled/fbeazt_vasal.yml

COPY ./automation/api/config/filebeat.yml /etc/filebeat/filebeat.yml

RUN mkdir -p /var/log/fbeazt

# Set the default command to execute
# when creating a new container
#CMD /etc/init.d/filebeat start && /usr/local/bin/uwsgi --emperor /etc/uwsgi/sites-enabled/ --logto /var/log/uwsgi.log
CMD /usr/bin/uwsgi --emperor /etc/uwsgi/sites-enabled/ --logto /var/log/uwsgi.log
