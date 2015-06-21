############################################################
# Dockerfile to build Python WSGI Application Containers
# Based on Ubuntu
############################################################

# Set the base image to Ubuntu
#FROM ubuntu:14.04
FROM cackharot/fbeazt

# File Author / Maintainer
MAINTAINER cackharot <cackharot@gmail.com>

# Update the sources list
RUN apt-get update

# Install basic applications
RUN apt-get install -y tar git curl nano wget net-tools

# Install Python and Basic Python Tools
RUN apt-get install -y python3 python3-dev python3-pip mongodb

# Create the MongoDB data directory
RUN mkdir -p /data/db

# Copy the application folder inside the container
CMD rm -rf /fbeazt

#ADD . /fbeazt
CMD git clone https://github.com/cackharot/fbeazt.git

# Get pip to download and install requirements:
RUN pip3 install -r /fbeazt/src/requirements.txt

# Expose port 27017 from the container to the host
EXPOSE 27017

# Expose http ports
EXPOSE 4000
EXPOSE 80

# Set the default directory where CMD will execute
WORKDIR /fbeazt

CMD mongod &> /dev/null &

# Set the default command to execute
# when creating a new container
# i.e. using CherryPy to serve the application
CMD python3 /fbeazt/src/foodbeazt/initdb.py &> /dev/null
CMD python3 /fbeazt/src/foodbeazt/manager.py run
