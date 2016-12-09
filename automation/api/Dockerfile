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
RUN apt-get install -y python3 python3-dev python3-pip git wget

# Create application directory
RUN mkdir -p /opt/fbeazt

RUN git clone https://github.com/cackharot/fbeazt.git /opt/fbeazt

# Get pip to download and install requirements:
RUN pip3 install -r /opt/fbeazt/src/requirements.txt

# Expose http ports
EXPOSE 4000

# Set the default directory where CMD will execute
WORKDIR /opt/fbeazt

COPY ./config/uwsgi/fbeazt_vasal.yml /etc/uwsgi/sites-enabled/fbeazt_vasal.yml

RUN wget https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-5.0.1-amd64.deb

RUN dpkg -i filebeat-5.0.1-amd64.deb

RUN rm -f filebeat-5.0.1-amd64.deb

COPY ./config/filebeat.yml /etc/filebeat/filebeat.yml

RUN mkdir -p /var/log/fbeazt
# Set the default command to execute
# when creating a new container
CMD /etc/init.d/filebeat start && /usr/local/bin/uwsgi --emperor /etc/uwsgi/sites-enabled/ --logto /var/log/uwsgi.log
