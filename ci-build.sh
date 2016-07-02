#!/bin/bash
source /var/go/fb/bin/activate &&
pip install -r src/foodbeazt/requirements.txt &&
python src/setup.py sdist &&
echo "Done..."
