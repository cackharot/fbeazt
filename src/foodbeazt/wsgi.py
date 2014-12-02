# Set the path
import os
import sys

os.environ['FOODBEAZT_CONFIG'] = os.path.dirname(__file__) + '/foodbeazt-prod.cfg'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from foodbeazt import app

if __name__ == "__main__":
    app.run()