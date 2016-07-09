import logging
import logging.config
import os
import yaml

def config_logging():
  log_file = os.path.abspath(os.path.join(os.path.dirname(__file__), 'logging.yml'))
  filename = os.environ.get('FOODBEAZT_LOG',log_file)
  with open(filename) as f:
    conf = yaml.load(f)
    logging.config.dictConfig(conf)
  logger = logging.getLogger(__name__)
  logger.info("Loading logging config file from %s" % filename)
