from airquality import db, ma

class AirQuality(db.Model):
	__tablename__ = 'air_quality'
	microstation_id = db.Column(db.String(50), db.ForeignKey("microstation.microstation_id"), primary_key=True)
	timestamp = db.Column(db.DateTime(timezone=False), primary_key=True)
	longitude = db.Column(db.Float(), primary_key=True)
	latitude =  db.Column(db.Float(), primary_key=True)
	pressure =  db.Column(db.Float)
	temperature = db.Column(db.Float)
	humidity = db.Column(db.Float)
	CO = db.Column(db.Float)
	NH3 = db.Column(db.Float)
    	NO2 = db.Column(db.Float)
	CH4 = db.Column(db.Float)
	H2 = db.Column(db.Float)
	C3H8 = db.Column(db.Float)
	C4H10 = db.Column(db.Float)
	C2H5OH = db.Column(db.Float)
	Dust = db.Column(db.Float)

	def __init__(self,microstation_id,timestamp,longitude,latitude,pressure,temperature,humidity,CO,NH3,NO2,CH4,H2,C3H8,C4H10,C2H5OH,Dust):
		self.microstation_id = microstation_id
		self.timestamp = timestamp
		self.longitude = longitude
		self.latitude = latitude
		self.pressure = pressure
		self.temperature = temperature
		self.humidity = humidity
		self.CO = CO
		self.NH3 = NH3
		self.NO2 = NO2
		self.CH4 = CH4
		self.H2 = H2
		self.C3H8 = C3H8
		self.C4H10 = C4H10
		self.C2H5OH = C2H5OH
		self.Dust = Dust

class AirQualitySchema(ma.ModelSchema):
	class Meta:
		model = AirQuality


class Microstation(db.Model):
	__tabletname__ = 'microstation'
	microstation_id = db.Column(db.String(50), primary_key=True)
	microstation_name = db.Column(db.String(50), unique=True)
	sensor_gps = db.Column(db.String(50))
	sensor_dust = db.Column(db.String(50))
	sensor_gas = db.Column(db.String(50))
	sensor_barometer = db.Column(db.String(50))
	measurements = db.relationship('AirQuality', backref='microstation', lazy='dynamic')

	def __init__(self, microstation_id, microstation_name, sensor_gps, sensor_dust, sensor_gas, sensor_barometer):
		self.microstation_id = microstation_id
		self.microstation_name = microstation_name
		self.sensor_gps = sensor_gps
		self.sensor_dust = sensor_dust
		self.sensor_gas = sensor_gas
		self.sensor_barometer = sensor_barometer

class MicrostationSchema(ma.ModelSchema):
	class Meta:
		model = Microstation

class LocalizedData(db.Model):
	__tabletname__ = 'localized_data'
	microstation_id = db.Column(db.String(50), db.ForeignKey("air_quality.microstation_id"), primary_key=True)
	timestamp = db.Column(db.DateTime(timezone=False), db.ForeignKey("air_quality.timestamp"), primary_key=True)
	longitude = db.Column(db.Float(), db.ForeignKey("air_quality.longitude"), primary_key=True)
	latitude = db.Column(db.Float(), db.ForeignKey("air_quality.latitude"), primary_key=True)
	province = db.Column(db.String(80))
	regio = db.Column(db.String(80))
	measurements = db.relationship('AirQuality', primaryjoin="and_(AirQuality.microstation_id==LocalizedData.microstation_id, AirQuality.timestamp==LocalizedData.timestamp, AirQuality.longitude==LocalizedData.longitude, AirQuality.latitude==LocalizedData.latitude)")

	def __init__(self, microstation_id, timestamp,longitude,latitude, province, regio):
		self.microstation_id = microstation_id
		self.timestamp = timestamp
		self.longitude = longitude
		self.latitude = latitude
		self.province = province
		self.regio = regio

class LocalizedDataSchema(ma.ModelSchema):
	class Meta:
		model = LocalizedData
