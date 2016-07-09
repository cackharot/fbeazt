from logging import Formatter
from bson import json_util
import json

class JsonLogFormatter(Formatter):
  def format(self, record):
    record.message = record.getMessage()
    record.asctime = self.formatTime(record, self.datefmt)
    s = self._fmt % record.__dict__
    data = {
      'level': record.levelname,
      'process': record.process,
      'timestamp': record.asctime,
      'message': s,
      'name': record.name,
      'module': record.module,
      'func_name': record.funcName or None,
    }
    if record.exc_info:
      # Cache the traceback text to avoid converting it multiple times
      # (it's constant anyway)
      if not record.exc_text:
        record.exc_text = self.formatException(record.exc_info)
        data['exception'] = record.exc_text
    return json.dumps(data,default=json_util.default)
