#!/bin/bash
python --version

pip install -r src/foodbeazt/requirements.txt && \
  python src/setup.py sdist
