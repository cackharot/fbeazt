import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), './src')))
#print(sys.path)
from foodbeazt.fapp import app

application = app

if __name__ == "__main__":
    application.run()
