from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow

app = Flask(__name__)
app.config.from_pyfile('airquality.cfg')
db = SQLAlchemy(app)
ma = Marshmallow(app)

from routes import * #must be imported after initialization of app

if __name__ == "__main__":
	app.run()
