#!/bin/bash
export FLASK_ENV=${FLASK_ENV:-development}
export FLASK_APP=src/foodbeazt.uwsgi
export FOODBEAZT_LOG="$(pwd)/src/foodbeazt/logging-dev.yml"
flask run -p 4000 -h '0.0.0.0'
