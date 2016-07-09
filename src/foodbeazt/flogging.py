import logging
import logging.config
import os
import yaml

def setup_logging():
  log_file = os.path.abspath(os.path.join(os.path.dirname(__file__), 'logging.yml'))
  filename = os.environ.get('FOODBEAZT_LOG',log_file)
  with open(filename) as f:
    config = yaml.safe_load(f.read())
    logging.config.dictConfig(config)
  logger = logging.getLogger(__name__)
  logger.info("Loading logging config file from %s" % filename)
