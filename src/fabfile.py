from fabric.api import *

# the user to use for the remote commands
env.user = 'vagrant'
env.key_filename = '~/.ssh/id_rsa'

# the servers where the commands are executed
# env.hosts = ['foodbeazt.in']
env.hosts = ['192.168.33.10']


def pack():
    # create a new source distribution as tarball
    local('python setup.py -q sdist --formats=gztar', capture=False)


def deploy():
    deploy_web()
    deploy_api()
    restart_services()


def deploy_web():
    with lcd('web'), hide('stdout'):
        local("npm install")
        local("gulp build")
        run("rm -rf /opt/fbeazt/app/*")
        run("mkdir -p /opt/fbeazt/app")
        put('dist/*', '/opt/fbeazt/app')


def deploy_api():
    # figure out the release name and version
    dist = env.get('DIST_NAME', None)
    if not dist:
        dist = local('python setup.py --fullname', capture=True).strip()
    # upload the source tarball to the temporary folder on the server
    run('mkdir -p /opt/fbeazt /opt/fbeazt/{bin,logs,sdist,tmp,app,admin_app}')
    put('dist/%s.tar.gz' % dist, '/opt/fbeazt/sdist')
    put('foodbeazt/uwsgi.ini', '/opt/fbeazt/bin')
    put('foodbeazt/uwsgi.py', '/opt/fbeazt/bin')
    put('requirements.txt', '/opt/fbeazt/bin')
    put('infra/files/etc/nginx/conf.d/fbeazt.conf', '/opt/fbeazt/bin')
    put('infra/files/etc/systemd/system/fbeazt.service', '/opt/fbeazt/bin')
    run("sudo ln -sf /opt/fbeazt/bin/fbeazt.conf /etc/nginx/conf.d/fbeazt.conf")
    run("sudo ln -sf /opt/fbeazt/bin/fbeazt.service /etc/systemd/system/fbeazt.service")
    run("/opt/fbeazt/.env/bin/pip install -r /opt/fbeazt/bin/requirements.txt")
    with cd('/opt/fbeazt/sdist'):
        run('/opt/fbeazt/.env/bin/pip install --upgrade --no-deps --force-reinstall %s.tar.gz' % dist)


def restart_services():
    # and finally touch the .wsgi file so that mod_wsgi triggers
    # a reload of the application
    run('touch /opt/fbeazt/bin/uwsgi.py')
    run('sudo systemctl daemon-reload')
    run('sudo service fbeazt restart')
    run('sudo service nginx reload')
