from distutils.core import setup

setup(
    name='foodbeazt',
    version='0.1',
    packages=['test', 'fbeazt', 'fbeazt.service', 'foodbeazt', 'foodbeazt.views', 'foodbeazt.resources'],
    package_dir={'': 'src'},
    url='www.foodbeazt.in',
    license='Apache License 2.0',
    author='cackharot',
    author_email='cackharot@gmail.com',
    description='online food ordering app'
)
