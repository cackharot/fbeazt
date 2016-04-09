#!/bin/zsh
echo 'Setting up virtual env...' &&
source `which virtualenvwrapper.sh` &&
mkvirtualenv fbeazt -p /usr/local/bin/python3 &&
workon fbeazt &&
pip install -r src/requirements.txt &&
echo 'Initializing seed data...' &&
python src/foodbeazt/initdb.py &&
echo 'Done!'
