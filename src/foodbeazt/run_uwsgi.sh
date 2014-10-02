#!/bin/sh
sudo uwsgi -s /tmp/uwsgi.sock -w wsgi:app --chown=www-data:www-data --logto2 /var/log/nginx/uwsgi_log.log