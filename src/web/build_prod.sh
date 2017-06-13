#!/bin/bash
set -e
set -x

rm -rf dist/ && npm run build
