#!/bin/bash
export FLASK_ENV=${FLASK_ENV:-development}
export FLASK_APP=src/foodbeazt.uwsgi
flask run -p 4000
