activate_this = '/opt/fbeazt/.env/bin/activate_this.py'
with open(activate_this) as file_:
  exec(file_.read(), dict(__file__=activate_this))

# # Set the path
import os, sys
# os.environ['FOODBEAZT_CONFIG'] = os.path.join(os.path.dirname(__file__), 'foodbeazt-prod.cfg')
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
print(sys.path)
from foodbeazt import app

if __name__ == "__main__":
  app.run()
