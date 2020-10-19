from flask import render_template, request, redirect, url_for, flash, abort, Response, jsonify
from sqlalchemy import text, func
from airquality import app
from models import *
from forms import *
from datetime import datetime
import time
import json

activeMicrostations = {}
datastream_reset_warmup = 15*60 #15 minutes
warmup_time = 10*60 #10 minutes
provinces = ["BRU", "VAN", "VBR", "VLI", "VOV", "VWV", "WBR", "WHT", "WLG", "WLX", "WNA"]

@app.route('/')
def index():
	return render_template('landing.html')

@app.route('/storedata', methods=['GET'])
def storedata():
	query_string = request.query_string
	if query_string is None:
		query_string = "QUERY_STRING IS NONE"
	app.logger.info('%s', query_string)

	microstation_id = None if request.args.get("IMEI") is None else "" + request.args.get("IMEI")
	hours = request.args.get("H")
	minutes = request.args.get("M")
	seconds = request.args.get("S")
	day = request.args.get("d")
	month = request.args.get("m")
	year = request.args.get("Y")
	longitude = None if request.args.get("LON") is None else float(request.args.get("LON"))
	latitude = None if request.args.get("LAT") is None else float(request.args.get("LAT"))

	pressure = None if request.args.get("P") is None else float(request.args.get("P"))
	temperature = None if request.args.get("T") is None else float(request.args.get("T"))
	humidity = None if request.args.get("Hu") is None else float(request.args.get("Hu"))
	CO = None if request.args.get("CO") is None else float(request.args.get("CO"))
	NH3 = None if request.args.get("NH3") is None else float(request.args.get("NH3"))
	NO2 = None if request.args.get("NO2") is None else float(request.args.get("NO2"))
	CH4 = None if request.args.get("CH4") is None else float(request.args.get("CH4"))
	H2 = None if request.args.get("H2") is None else float(request.args.get("H2"))
	C3H8 = None if request.args.get("C3H8") is None else float(request.args.get("C3H8"))
	C4H10 = None if request.args.get("C4H10") is None else float(request.args.get("C4H10"))
	C2H5OH = None if request.args.get("C2H5OH") is None else float(request.args.get("C2H5OH"))
	dust = None if request.args.get("D") is None else float(request.args.get("D"))

	#Validation
	if (hours is None) or (minutes is None) or (seconds is None) or (day is None) or (day == str(0)) or (month is None) or (month == str(0)) or (year is None) or (year == str(0)) or (longitude is None) or (latitude is None) or (microstation_id is None):
		print "Abort 406: Unable to create primary key due to None value in PK. Abort storing data with code 406."
		abort(406)
	elif (db.session.query(Microstation.microstation_id).filter_by(microstation_id=microstation_id).scalar() is None):
		print "Abort 412: This Microstation is not registered. Abort storing data with code 412."
		abort(412)
	else:
		print "**** New Data incoming from MS_id: " + str(microstation_id) + " *****"
		datetime_string = hours + ":" + minutes + ":" + seconds + " " + day + "/" + month + "/" + year
		timestamp = datetime.strptime(datetime_string, "%H:%M:%S %d/%m/%Y")
		print "timetamp: " + str(timestamp)

		#Check if MS is active:
		warmup_needed = False
		if microstation_id in activeMicrostations:
			#Check if last update occured in the last 15 min.
			timeDelta1 = timestamp - activeMicrostations[microstation_id][1]
			print "activeMicrostaions[" + str(microstation_id) + "] contains: " + str(activeMicrostations[microstation_id])
			print "timeDelta1 = timestamp - activeMicrostations[microstation_id][1] = " + str(timeDelta1)
			print "timeDelta1.total_seconds(): " + str(timeDelta1.total_seconds())
			if timeDelta1.total_seconds() >= datastream_reset_warmup:
				print "timeDelta1 >= 900s -> Warmup needed"
				warmup_needed = True
			elif timeDelta1.total_seconds() < 0.01:
				#Microstation did not refresh timestamp or same data is send twice
				print "Abort 409: Timestamp is identical to previous one."
				abort(409)
			else:
				#update last timestamp:
				activeMicrostations[microstation_id][1] = timestamp
				firstTimestamp = activeMicrostations[microstation_id][0]
				lastTimestamp = activeMicrostations[microstation_id][1]
				#Check if MS has warmed up for 10 min.
				timeDelta2 = lastTimestamp - firstTimestamp
				print "firstTimestamp: " + str(firstTimestamp)
				print "lastTimestamp: " + str(lastTimestamp)
				print "timeDelta2 = lastTimestamp - firstTimestamp = " + str(timeDelta2)
				if timeDelta2.total_seconds() >= warmup_time:
					print "timeDelta2 >= 600s -> Data being stored..."
					measurement = AirQuality(microstation_id, timestamp, longitude, latitude, pressure, temperature, humidity, CO, NH3, NO2, CH4, H2, C3H8, C4H10, C2H5OH, dust)
					db.session.add(measurement)
					db.session.commit()
					localized_measurement = LocalizedData(microstation_id, timestamp, longitude, latitude,"","");
					db.session.add(localized_measurement)
					db.session.commit()
					return Response("OK", status=200)
		else:
			warmup_needed = True

		if warmup_needed:
			activeMicrostations[microstation_id] = [timestamp, timestamp]

		#Microstation is warming up:
		return Response("Warming up", status=202)

@app.route('/reliability')
def reliability():
	return render_template('reliability.html')

@app.route('/participate')
def participate():
	return render_template('participate.html')

@app.route('/participate/register', methods=['GET', 'POST'])
def register():
	form = RegisterMicrostationForm(request.form)
	if request.method == 'POST' and form.validate():
		#Validate if id is unique!
		exists = db.session.query(Microstation.microstation_id).filter_by(microstation_id=form.microstation_id.data).scalar() is not None
		if (exists):
			#This microstation_id is already registered
			flash("This IMEI number has already been registered...")
			return render_template('register_microstation.html', form=form)
		else:
			ms = Microstation(form.microstation_id.data, form.microstation_name.data, form.sensor_gps.data, form.sensor_dust.data, form.sensor_gas.data, form.sensor_barometer.data)
			db.session.add(ms)
			db.session.commit()
			flash("That's it! We're all set up to capture your data. Be safe out there!")
			return redirect(url_for('participate'))
	return render_template('register_microstation.html', form=form)

@app.route('/contact')
def contact():
	return render_template('contact.html')

@app.route('/heatmap')
def heatmap():
	return render_template('heatmap.html')


@app.route('/initHeatmaps')
def initHeatmaps():
	getName = "" + request.args.get("Name")
	getProvince = "" + request.args.get("Province")
	microstation_id = ""
	query = ""

	#Prevent sql injections
	if getProvince[3:] in provinces:

		if getName == "all":

				heatData = db.session.query(AirQuality.microstation_id.label("id"), func.round(func.cast(AirQuality.longitude, db.Numeric()), 3).label("long"), \
										 func.round(func.cast(AirQuality.latitude, db.Numeric()), 3).label("lat"), \
										 func.avg(AirQuality.temperature).label("temperature"), func.avg(AirQuality.humidity).label("humidity"), \
				 						 func.avg(AirQuality.CO).label("CO"), func.avg(AirQuality.NH3).label("NH3"), func.avg(AirQuality.NO2).label("NO2"), \
										 func.avg(AirQuality.CH4).label("CH4"), func.avg(AirQuality.H2).label("H2"), func.avg(AirQuality.C3H8).label("C3H8"), \
										 func.avg(AirQuality.C4H10).label("C4H10"), func.avg(AirQuality.C2H5OH).label("C2H5OH"), func.avg(AirQuality.Dust).label("Dust")) \
								  .join(LocalizedData.measurements).filter(LocalizedData.province==("BE-"+getProvince[3:])) \
								  .group_by(AirQuality.microstation_id, func.round(func.cast(AirQuality.longitude, db.Numeric()), 3), func.round(func.cast(AirQuality.latitude, db.Numeric()), 3)) \
								  .all()

		else:

				#Prevent sql injections
				allStations = db.engine.execute(text("SELECT microstation_id, microstation_name FROM microstation")).fetchall()
				for row in allStations:
					if row[1] == getName:
						microstation_id = row[0]

						heatData = db.session.query(AirQuality.microstation_id.label("id"), func.round(func.cast(AirQuality.longitude, db.Numeric()), 3).label("long"), \
												 func.round(func.cast(AirQuality.latitude, db.Numeric()), 3).label("lat"), \
												 func.avg(AirQuality.temperature).label("temperature"), func.avg(AirQuality.humidity).label("humidity"), \
						 						 func.avg(AirQuality.CO).label("CO"), func.avg(AirQuality.NH3).label("NH3"), func.avg(AirQuality.NO2).label("NO2"), \
												 func.avg(AirQuality.CH4).label("CH4"), func.avg(AirQuality.H2).label("H2"), func.avg(AirQuality.C3H8).label("C3H8"), \
												 func.avg(AirQuality.C4H10).label("C4H10"), func.avg(AirQuality.C2H5OH).label("C2H5OH"), func.avg(AirQuality.Dust).label("Dust")) \
										  .join(LocalizedData.measurements).filter(LocalizedData.province==("BE-"+getProvince[3:]), AirQuality.microstation_id==(microstation_id)) \
										  .group_by(AirQuality.microstation_id, func.round(func.cast(AirQuality.longitude, db.Numeric()), 3), func.round(func.cast(AirQuality.latitude, db.Numeric()), 3)) \
										  .all()
						break

		temp_array = []
		# Problems with dict(heatData), so hacky method used ..
		for point in heatData:
			heatJSON = {}
			heatJSON["microstation_id"] = point.id
			heatJSON["long"] = float(point.long)
			heatJSON["lat"] = float(point.lat)
			heatJSON["temperature"] = point.temperature
			heatJSON["humidity"] = point.humidity
			heatJSON["CO"] = point.CO
			heatJSON["NH3"] = point.NH3
			heatJSON["NO2"] = point.NO2
			heatJSON["CH4"] = point.CH4
			heatJSON["H2"] = point.H2
			heatJSON["C3H8"] = point.C3H8
			heatJSON["C4H10"] = point.C4H10
			heatJSON["C2H5OH"] = point.C2H5OH
			heatJSON["Dust"] = point.Dust
			temp_array.append(heatJSON)
		return jsonify(temp_array)

	print "Abort 415: No valid province."
	abort(415)

@app.route('/initMarkers')
def initMarkers():
	getName = "" + request.args.get("Name")
	microstation_id = ""
	query = ""


	if getName == "all":

			query = "SELECT * FROM init_markers_without_microstation_id"

	else:

			#Prevent sql injections
			allStations = db.engine.execute(text("SELECT microstation_id, microstation_name FROM microstation")).fetchall()
			for row in allStations:
				if row[1] == getName:
					microstation_id = row[0]

					query = """SELECT to_json(t)
								FROM (
								    SELECT 	microstation_id,
								    		markerlong,
								            markerlat,
								            COUNT(temperature) AS dataPointCount,
								            json_agg(json_build_object('c', json_build_array(
								                                        json_build_object('v', 'Date(' || EXTRACT(YEAR FROM timestamp_halfhour) || ',' || (EXTRACT(MONTH FROM timestamp_halfhour) - 1) || ',' || EXTRACT(DAY FROM timestamp_halfhour) || ',' || EXTRACT(HOUR FROM timestamp_halfhour) || ',' || EXTRACT(MINUTE FROM timestamp_halfhour) || ',' || EXTRACT(SECOND FROM timestamp_halfhour) || ', 0)'),
								                                        json_build_object('v', pressure),
								                                        json_build_object('v', temperature),
								                                        json_build_object('v', humidity),
								                                        json_build_object('v', "CO"),
								                                        json_build_object('v', "NH3"),
								                                        json_build_object('v', "NO2"),
								                                        json_build_object('v', "CH4"),
								                                        json_build_object('v', "H2"),
								                                        json_build_object('v', "C3H8"),
								                                        json_build_object('v', "C4H10"),
								                                        json_build_object('v', "C2H5OH"),
								                                        json_build_object('v', "Dust")
								                                            )
								                                        )
								             ) AS dataPoints
								    FROM view_markers_per_halfhour_with_microstation_id
								    WHERE microstation_id LIKE \'""" + microstation_id + """\'
								    GROUP BY microstation_id, markerlong, markerlat
								    HAVING COUNT(temperature) > 20
								) t
							"""
					break	#exit for-loop

	if query != "":
		statement = text(query)
		aq_data = db.engine.execute(statement).fetchall()

		temp_array = []
		for row in aq_data:
			temp_array.append(row[0])
		return jsonify(temp_array)

	else:
		return ""



@app.route('/initStationControl')
def initStationControl():
	statement = text("SELECT to_json(t) FROM (SELECT json_agg(json_build_object('microstation_name', microstation_name)) AS names FROM microstation) t")
	aq_data = db.engine.execute(statement)

	temp_array = []
	for row in aq_data:
		temp_array.append(row[0])

	return jsonify(temp_array)

@app.route('/fetchProvinceData')
def fetchProvinceData():
	getProvince = "" + request.args.get("Province")
	avgJSON = {}
	if getProvince[3:] in provinces:
		avgData = db.session.query(func.avg(AirQuality.temperature).label("temperature"), func.avg(AirQuality.humidity).label("humidity"), \
		 						 func.avg(AirQuality.CO).label("CO"), func.avg(AirQuality.NH3).label("NH3"), func.avg(AirQuality.NO2).label("NO2"), \
								 func.avg(AirQuality.CH4).label("CH4"), func.avg(AirQuality.H2).label("H2"), func.avg(AirQuality.C3H8).label("C3H8"), \
								 func.avg(AirQuality.C4H10).label("C4H10"), func.avg(AirQuality.C2H5OH).label("C2H5OH"), func.avg(AirQuality.Dust).label("Dust")) \
						  .join(LocalizedData.measurements).filter(LocalizedData.province==("BE-"+getProvince[3:])) \
						  .first()
		# Problems with dict(avgData), so hacky method used ..
		avgJSON["temperature"] = avgData.temperature
		avgJSON["humidity"] = avgData.humidity
		avgJSON["CO"] = avgData.CO
		avgJSON["NH3"] = avgData.NH3
		avgJSON["NO2"] = avgData.NO2
		avgJSON["CH4"] = avgData.CH4
		avgJSON["H2"] = avgData.H2
		avgJSON["C3H8"] = avgData.C3H8
		avgJSON["C4H10"] = avgData.C4H10
		avgJSON["C2H5OH"] = avgData.C2H5OH
		avgJSON["Dust"] = avgData.Dust
		avgJSON["Province"] = "BE-"+getProvince[3:]
	return jsonify(avgJSON)

@app.route('/fetchRegioData')
def fetchRegioData():
	getProvince = "" + request.args.get("Province")
	avgJSON = {}
	if getProvince[3:] in provinces:
		avgData = db.session.query(func.avg(AirQuality.temperature).label("temperature"), func.avg(AirQuality.humidity).label("humidity"), \
		 						 func.avg(AirQuality.CO).label("CO"), func.avg(AirQuality.NH3).label("NH3"), func.avg(AirQuality.NO2).label("NO2"), \
								 func.avg(AirQuality.CH4).label("CH4"), func.avg(AirQuality.H2).label("H2"), func.avg(AirQuality.C3H8).label("C3H8"), \
								 func.avg(AirQuality.C4H10).label("C4H10"), func.avg(AirQuality.C2H5OH).label("C2H5OH"), func.avg(AirQuality.Dust).label("Dust"), \
								 LocalizedData.regio.label("regio")) \
						  .join(LocalizedData.measurements).filter(LocalizedData.province==("BE-"+getProvince[3:])) \
						  .group_by(LocalizedData.regio) \
						  .all()
		# Problems with dict(avgData), so hacky method used ..
		for area in avgData:
			regioJSON = {}
			regioJSON["temperature"] = area.temperature
			regioJSON["humidity"] = area.humidity
			regioJSON["CO"] = area.CO
			regioJSON["NH3"] = area.NH3
			regioJSON["NO2"] = area.NO2
			regioJSON["CH4"] = area.CH4
			regioJSON["H2"] = area.H2
			regioJSON["C3H8"] = area.C3H8
			regioJSON["C4H10"] = area.C4H10
			regioJSON["C2H5OH"] = area.C2H5OH
			regioJSON["Dust"] = area.Dust
			avgJSON[area.regio] = regioJSON

	return jsonify(avgJSON)

@app.route('/getRegioEnvelop')
def getRegioEnvelop():
	getRegio = "" + request.args.get("Regio")
	if getRegio[:2] == "BE":
		geom = db.session.query(func.get_envelope(getRegio).label("env")).first().env
		return jsonify(geom)
	print "Abort 415: No valid regio."
	abort(415)

@app.route('/getProvinceEnvelop')
def getProvinceEnvelop():
	getProvince = "BE-" + request.args.get("Province")[3:]
	if getProvince[3:] in provinces:
		geom = db.session.query(func.get_provenvelope(getProvince).label("env")).first().env
		return jsonify(geom)
	print "Abort 415: No valid regio."
	abort(415)
