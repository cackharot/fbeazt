from setuptools import setup, find_packages
import os
from foodbeazt.version import __VERSION__

def package_files(ds):
  paths = []
  for directory in ds:
    for (path, directories, filenames) in os.walk(directory):
      for filename in filenames:
        paths.append(os.path.join('..', path, filename))
  return paths

extra_files = package_files(['foodbeazt/templates', 'foodbeazt/static'])

setup(
    name='foodbeazt',
    version=__VERSION__,
    packages=find_packages(),
    url='www.foodbeazt.in',
    license='Apache License 2.0',
    author='cackharot',
    author_email='cackharot@gmail.com',
    long_description='online food ordering app',
    zip_safe=False,
    package_data={'foodbeazt': extra_files},
    install_requires=['Flask','flask-login','flask-mail',
        'flask-pymongo','flask-restful','flask-babel', 'flask-principal',
        'flask-cors', 'uwsgi',
        'requests', 'pymongo']
)
