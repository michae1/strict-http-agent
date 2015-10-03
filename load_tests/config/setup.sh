#!/bin/bash

# Script to set up a Django project on Vagrant.

# Installation settings
echo "Setting up server for load tests"
echo $1

PROJECT_NAME=strict_agent_lt

PROJECT_DIR=/home/vagrant/$PROJECT_NAME

apt-get update -y

# apt-get -y install python-software-properties git
# add-apt-repository ppa:chris-lea/node.js > /dev/null 2>&1
# apt-get install -y python-pip
# apt-get install -y libjpeg-dev libtiff-dev zlib1g-dev libfreetype6-dev liblcms2-dev

apt-get -y install nodejs
apt-get -y install npm

# ln -s /usr/bin/nodejs /usr/bin/node
cp $PROJECT_DIR/load_tests/config/node-server.conf /etc/init/
cd $PROJECT_DIR
# chmod +x /etc/init.d/node-srv 
# update-rc.d node-srv defaults
# /etc/init.d/node-srv start
# npm install
# Project libs front/back
su - vagrant -c "cd $PROJECT_DIR && npm install"

# su - vagrant -c "cd $PROJECT_DIR/load_tests && nodejs server.js"
