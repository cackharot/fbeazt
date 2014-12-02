from setuptools import setup, find_packages

setup(
    name='foodbeazt',
    version='0.1',
    packages=find_packages(),
    url='www.foodbeazt.in',
    license='Apache License 2.0',
    author='cackharot',
    author_email='cackharot@gmail.com',
    long_description='online food ordering app',
    zip_safe=False,
    install_requires=['Flask']
)
