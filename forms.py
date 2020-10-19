from wtforms import Form, BooleanField, StringField, SelectField, validators

class RegisterMicrostationForm(Form):
	microstation_id = StringField('IMEI', [validators.Length(min=15, max=15, message="IMEI number should be 15 characters long.")])
	microstation_name = StringField('Microstation Name', [validators.Length(min=2, max=32, message="Your microstation's name should be 2 to 32 characters long.")])

	choices_gps = [("", "None"), ("Grove - GPS", "Grove - GPS"), ("Other", "Other")]
	sensor_gps = SelectField('GPS Sensor', choices=choices_gps)
	choices_dust = [("", "None"), ("Grove - Dust Sensor","Grove - Dust Sensor"), ("Other", "Other")]
	sensor_dust = SelectField('Dust Sensor', choices=choices_dust)
	choices_gas = [("", "None"), ("Grove - Multichannel Gas Sensor","Grove - Multichannel Gas Sensor"), ("Other", "Other")]
	sensor_gas = SelectField('Gas Sensor', choices=choices_gas)
	choices_barometer = [("", "None"), ("Grove - Barometer Sensor (BME280)","Grove - Barometer Sensor (BME280)"), ("Other", "Other")]
	sensor_barometer = SelectField('Barometer Sensor', choices=choices_barometer)
