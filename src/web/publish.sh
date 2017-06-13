#!/bin/bash
set -e
set -x

SSH_KEY=${SSH_KEY:-}
HOST=${HOST:-}
DEST=${DEST:-'/opt/fbeazt/src/web/dist'}
DEST_ARTIFACT=${DEST_ARTIFACT:-'/tmp'}
BUILD_DIR=${BUILD_DIR:-"dist/"}
OUTPUT_FILE='fweb.tar.gz'

if [ -z ${HOST} ]; then
    echo 'HOST env is required. user@domain.com'
    exit 1
fi

if [ -z ${SSH_KEY} ]; then
    echo 'SSH_KEY env is required.'
    exit 1
fi

if [ ! -d "${BUILD_DIR}" ]; then
    `./build_prod.sh`
fi

echo "Zipping ${BUILD_DIR} to ${OUTPUT_FILE}"
tar cf ${OUTPUT_FILE} -C ${BUILD_DIR} .
echo "Copying ${OUTPUT_FILE} to ${HOST}"
scp -i ${SSH_KEY} ${OUTPUT_FILE} ${HOST}:${DEST_ARTIFACT}
echo "Extracting..."
ssh -i ${SSH_KEY} ${HOST} "mkdir -p ${DEST}; \
    tar -xf ${DEST_ARTIFACT}/${OUTPUT_FILE} -C ${DEST}; ls -ltr ${DEST}"
