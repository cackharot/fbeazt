FROM alpine:edge
MAINTAINER cackharot <cackharot@gmail.com>

RUN apk update
RUN apk add mongodb --update-cache --repository http://dl-3.alpinelinux.org/alpine/edge/testing/ --allow-untrusted
VOLUME /data/db
VOLUME /mongodb/backup
EXPOSE 27017

ADD docker_entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

CMD ["mongod"]