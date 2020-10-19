// pressure, temperature, humidity, CO, NH3, NO2, CH4, H2, C3H8, C4H10, C2H5OH, Dust

var map;
var mode = "countryMode";
var heatmaps = [];
var heatmapTemperature, heatmapHumidity, heatmapCO, heatmapNH3, heatmapNO2, heatmapCH4, heatmapH2, heatmapC3H8, heatmapC4H10, heatmapC2H5OH, heatmapDust;
var heatmapTemperature_data, heatmapHumidity_data, heatmapCO_data, heatmapNH3_data, heatmapNO2_data, heatmapCH4_data, heatmapH2_data, heatmapC3H8_data, heatmapC4H10_data, heatmapC2H5OH_data, heatmapDust_data;
var markerCount = 0;
var markers_data = []; //all info needed to create the aggregated markers.
var markers = [];
var avrJSON = {};
var avrJSONRegio = {};
var infoWindow;
var dataPoints_json;
var geoData = [];
var BEprovinces = ["BE_WLG", "BE_VLI", "BE_WLX", "BE_VBR", "BE_VWV", "BE_VAN", "BE_VOV", "BE_WNA", "BE_BRU", "BE_WBR", "BE_WHT"];
var currentProvince = -1;
var options = ["temperature", "humidity", "CO", "NH3", "NO2", "CH4", "H2", "C3H8", "C4H10", "C2H5OH", "Dust"];
var parameter_to_index = {
        pressure: 1,
        temperature: 2,
        humidity: 3,
        CO: 4,
        NH3: 5,
        NO2: 6,
        CH4: 7,
        H2: 8,
        C3H8: 9,
        C4H10: 10,
        C2H5OH: 11,
        Dust: 12
};



// Google Charts
google.charts.load('visualization', '1', {'packages':['corechart','controls']});

// Initialize Map Control
var aq_parameter_select = document.getElementById("aq_parameter_select");
aq_parameter_select.onchange = remodelMap;
var station_select = document.getElementById("station_select");
// Google Maps
function initMap() {
      var belgicaCenter = {lat: 50.52045, lng: 4.44878};
      var mapOptions = {
          center: belgicaCenter,
          zoom: 8.3,
          disableDefaultUI: true,
          gestureHandling: 'none',
          zoomControl: false,
          styles: map_styling
      };
      // init map
      map = new google.maps.Map(document.getElementById('map'), mapOptions);
      // init info window (Note: only one needed)
      infoWindow = new google.maps.InfoWindow;

      //fetchProvinceData
      getProvinceAverages();

      //GeoJson
      var geoTotal = new google.maps.Data();
      var geoProvince = new google.maps.Data();
      geoData.push(geoTotal);
      geoData.push(geoProvince);
      geoTotal.loadGeoJson('static/geojson/belgium-provinces.geojson');

      setTimeout(function() {

      applyGeoStyle(geoTotal, "temperature");
      applyGeoEvents(geoTotal);

      geoTotal.setMap(map);

      addClickEventsTotal(geoTotal);

      //Markers
      markDaMap();

      // init heatmaps (global variables are found in _map_global_variables.js
      heatmapTemperature_data = new google.maps.MVCArray();
      heatmapHumidity_data = new google.maps.MVCArray();
      heatmapCO_data = new google.maps.MVCArray();
      heatmapNH3_data = new google.maps.MVCArray();
      heatmapNO2_data = new google.maps.MVCArray();
      heatmapCH4_data = new google.maps.MVCArray();
      heatmapH2_data = new google.maps.MVCArray();
      heatmapC3H8_data = new google.maps.MVCArray();
      heatmapC4H10_data = new google.maps.MVCArray();
      heatmapC2H5OH_data = new google.maps.MVCArray();
      heatmapDust_data = new google.maps.MVCArray();


      // init heatmap Temperature
      var heatmapTemperature_options = {
            name: "temperature",
            data: heatmapTemperature_data,
            map: null,
            opacity: 1
      };

      // init heatmap heatmapHumidity
      var heatmapHumidity_options = {
            name: "humidity",
            data: heatmapHumidity_data,
            map: null,
            opacity: 1,
            gradient: gradientHumidity
      };

      // init heatmap heatmapCO
      var heatmapCO_options = {
            name: "CO",
            data: heatmapCO_data,
            map: null,
            opacity: 1,
            gradient: gradientCO
      };

      // init heatmap heatmapNH3
      var heatmapNH3_options = {
            name: "NH3",
            data: heatmapNH3_data,
            map: null,
            opacity: 1,
            gradient: gradientNH3
      };

      // init heatmap heatmapNO2
      var heatmapNO2_options = {
            name: "NO2",
            data: heatmapNO2_data,
            map: null,
            opacity: 1
      };

      // init heatmap heatmapCH4
      var heatmapCH4_options = {
            name: "CH4",
            data: heatmapCH4_data,
            map: null,
            opacity: 1
      };

      // init heatmap heatmapH2
      var heatmapH2_options = {
            name: "H2",
            data: heatmapH2_data,
            map: null,
            opacity: 1
      };

      // init heatmap heatmapC3H8
      var heatmapC3H8_options = {
            name: "C3H8",
            data: heatmapC3H8_data,
            map: null,
            opacity: 1
      };

      // init heatmap heatmapC3H8
      var heatmapC4H10_options = {
            name: "C4H10",
            data: heatmapC4H10_data,
            map: null,
            opacity: 1
      };

      // init heatmap heatmapC3H8
      var heatmapC2H5OH_options = {
            name: "C2H5OH",
            data: heatmapC2H5OH_data,
            map: null,
            opacity: 1
      };

      // init heatmap heatmapC3H8
      var heatmapDust_options = {
            name: "Dust",
            data: heatmapDust_data,
            map: null,
            opacity: 1
      };

      heatmapTemperature = new google.maps.visualization.HeatmapLayer(heatmapTemperature_options);
      heatmapHumidity = new google.maps.visualization.HeatmapLayer(heatmapHumidity_options);
      heatmapCO = new google.maps.visualization.HeatmapLayer(heatmapCO_options);
      heatmapNH3 = new google.maps.visualization.HeatmapLayer(heatmapNH3_options);
      heatmapNO2 = new google.maps.visualization.HeatmapLayer(heatmapNO2_options);
      heatmapCH4 = new google.maps.visualization.HeatmapLayer(heatmapCH4_options);
      heatmapH2 = new google.maps.visualization.HeatmapLayer(heatmapH2_options);
      heatmapC3H8 = new google.maps.visualization.HeatmapLayer(heatmapC3H8_options);
      heatmapC4H10 = new google.maps.visualization.HeatmapLayer(heatmapC4H10_options);
      heatmapC2H5OH = new google.maps.visualization.HeatmapLayer(heatmapC2H5OH_options);
      heatmapDust = new google.maps.visualization.HeatmapLayer(heatmapDust_options);

      heatmaps.push(heatmapTemperature, heatmapHumidity, heatmapCO, heatmapNH3, heatmapNO2, heatmapCH4, heatmapH2, heatmapC3H8, heatmapC4H10, heatmapC2H5OH, heatmapDust);

      //download scroller data
      downloadUrl('/initStationControl',function(data){
        var stationsNames_json = JSON.parse(data.responseText);
        var stationsNames_array = Object.values(stationsNames_json);
        for(var i = 0; i < stationsNames_json["0"].names.length ; i++){
          var option = document.createElement("option");
          option.value = stationsNames_json["0"].names[String(i)].microstation_name;
          option.innerHTML = stationsNames_json["0"].names[String(i)].microstation_name;
          station_select.appendChild(option);
        }

        station_select.onchange = function() {
          if(mode === "regioMode") {
            heatDaMap();
            markDaMap();
          }
        };

       });

       addBackButton();
       addSelectControls();
       addGradientCard();
       changeGradient(aq_parameter_select.value);

     }, 1500);
}

//Draw heatmap on Maps.
function heatDaMap() {
  var station = station_select.value;

  // Empty current heatmap data
  heatmapTemperature_data.clear();
  heatmapHumidity_data.clear();
  heatmapCO_data.clear();
  heatmapNH3_data.clear();
  heatmapNO2_data.clear();
  heatmapCH4_data.clear();
  heatmapH2_data.clear();
  heatmapC3H8_data.clear();
  heatmapC4H10_data.clear();
  heatmapC2H5OH_data.clear();
  //heatmapDust_data.clear();

  // Download Heatmap data
  downloadUrl('/initHeatmaps?Name='+station+'&Province='+BEprovinces[currentProvince], function(data) {
    var dataPoints_json = JSON.parse(data.responseText);
    var dataPoints_array = Object.values(dataPoints_json);

    Array.prototype.forEach.call(dataPoints_array,function(dataPoint) {
            var lat = dataPoint.lat;
            var long = dataPoint.long;
            var temperature = dataPoint.temperature;
            var humidity = dataPoint.humidity;
            var CO = dataPoint.CO;
            var NH3 = dataPoint.NH3;
            var NO2 = dataPoint.NO2;
            var CH4 = dataPoint.CH4;
            var H2 = dataPoint.H2;
            var C3H8 = dataPoint.C3H8;
            var C4H10 = dataPoint.C4H10;
            var C2H5OH = dataPoint.C2H5OH;

            if (typeof lat == 'undefined' || typeof long == 'undefined' || typeof temperature == 'undefined' || typeof humidity == 'undefined' || typeof CO == 'undefined' || typeof NH3 == 'undefined' || typeof NO2 == 'undefined' || typeof CH4 == 'undefined' || typeof H2 == 'undefined' || typeof C2H5OH == 'undefined' || typeof C3H8 == 'undefined' || typeof C4H10 == 'undefined') {
              console.log("A measurement's input was found to be undefined");
            } else {
              var newLatLng = new google.maps.LatLng(lat, long);
              // Insert data into heatmap layers
              heatmapTemperature_data.push({location: newLatLng, weight: temperature});
              heatmapHumidity_data.push({location: newLatLng, weight: humidity});
              heatmapCO_data.push({location: newLatLng, weight: CO});
              heatmapNH3_data.push({location: newLatLng, weight: NH3});
              heatmapNO2_data.push({location: newLatLng, weight: NO2});
              heatmapCH4_data.push({location: newLatLng, weight: CH4});
              heatmapH2_data.push({location: newLatLng, weight: H2});
              heatmapC3H8_data.push({location: newLatLng, weight: C3H8});
              heatmapC4H10_data.push({location: newLatLng, weight: C4H10});
              heatmapC2H5OH_data.push({location: newLatLng, weight: C2H5OH});
            }
    });

    // Trigger first heatmap display
    remodelMap();

  });
}

//Draw markers on Maps.
function markDaMap() {
  var station = station_select.value;

  //Remove current markers
  var l = markers.length
  for(var i = 0 ; i < l ; i++){
            markers[l-i-1].setMap(null);
            markers.pop();
  }

  // Download data
  downloadUrl('/initMarkers?Name='+station, function(data) {
      var dataPoints_json = JSON.parse(data.responseText);
      var dataPoints_array = Object.values(dataPoints_json);

      Array.prototype.forEach.call(dataPoints_array, function(m) {

            var lat = m.markerlat;
            var long = m.markerlong;
            var dataPoints = m.datapoints;

            // Markers
            var newLatLng = new google.maps.LatLng(lat, long);
            var newMarker = new google.maps.Marker({
                position: newLatLng,
                icon: {
                    path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                    scale: 6,
                    strokeColor: '#a30f2d',
                    strokeWeight: 3,
                    fillOpacity: 1,
                    fillColor: '#fbd0d9'
                }
            });
            markers.push(newMarker);

            // Create DataTable for this marker
            var graphData = {
                "cols": [{
                    "id": "colA",
                    "label": "Date Range",
                    "pattern": "",
                    "type": "datetime"
                }, {
                    "id": "colPressure",
                    "label": "Pressure",
                    "pattern": "",
                    "type": "number"
                }, {
                    "id": "colTemperature",
                    "label": "Temperature",
                    "pattern": "",
                    "type": "number"
                }, {
                    "id": "colHumidity",
                    "label": "Humidity",
                    "pattern": "",
                    "type": "number"
                }, {
                    "id": "colCO",
                    "label": "CO",
                    "pattern": "",
                    "type": "number"
                }, {
                    "id": "colNH3",
                    "label": "NH3",
                    "pattern": "",
                    "type": "number"
                }, {
                    "id": "colNO2",
                    "label": "NO2",
                    "pattern": "",
                    "type": "number"
                }, {
                    "id": "colCH4",
                    "label": "CH4",
                    "pattern": "",
                    "type": "number"
                }, {
                    "id": "colH2",
                    "label": "H2",
                    "pattern": "",
                    "type": "number"
                }, {
                    "id": "colC3H8",
                    "label": "C3H8",
                    "pattern": "",
                    "type": "number"
                }, {
                    "id": "colC4H10",
                    "label": "C4H10",
                    "pattern": "",
                    "type": "number"
                }, {
                    "id": "colC2H5OH",
                    "label": "C2H5OH",
                    "pattern": "",
                    "type": "number"
                }, {
                    "id": "colDust",
                    "label": "Dust",
                    "pattern": "",
                    "type": "number"
                }],
                "rows": dataPoints
            };

            var dataTable = new google.visualization.DataTable(graphData);

            // Add Listener to open Info Window
            newMarker.addListener('click', function() {
                    drawDashboard(dataTable);
                    infoWindow.open(map,newMarker);
            });

            if(mode=="regioMode") {
              drawMarkers();
            }

      });

  });
}

function drawMarkers() {
  //Get correct feature (province)
  var provinceFeature;
  geoData[0].forEach(function(feature){
    if(feature.getProperty("province_iso").substring(3,6)==BEprovinces[currentProvince].substring(3,6)) {
      provinceFeature = feature;
    }
  });
  //For each marker check if within province -> YES; show on map
  for(arrow in markers) {
    //Province.getType() == MultiPolygon => Iterate over individual polygons
    for(polygon in provinceFeature.getGeometry().getArray()) {
      coordArray = [];
      //google.maps.Data.Polygon != google.maps.Polygon => Need to fetch array of coordinates to create google.maps.Polygon
      //Iterate over linearRings in Polygon
      for(linearRing in provinceFeature.getGeometry().getArray()[polygon].getArray()) {
        //Push entire coordinate array of linearRing in coordArray via .push.apply(a, b)
        coordArray.push.apply(coordArray, provinceFeature.getGeometry().getArray()[polygon].getArray()[linearRing].getArray());
      }
      //Create new google.maps.Polygon from coordArray
      mapsPolygon = new google.maps.Polygon({paths:coordArray})
      //Check if marker inside this polygon
      if(google.maps.geometry.poly.containsLocation(markers[arrow].position, mapsPolygon)) {
        //show on map
        markers[arrow].setMap(map);
        //exit polygon loop
        break;
      }
    }
  }
}

function getProvinceAverages() {
  for(province in BEprovinces){
    provStr = BEprovinces[province];
    downloadUrl('/fetchProvinceData?Province='+provStr,function(data){
      var avrProv = JSON.parse(data.responseText);
      avrJSON[avrProv["Province"]] = avrProv;
     });
  }
}

function getRegioAverages(province) {
  downloadUrl('/fetchRegioData?Province='+province,function(data){
    avrJSONRegio = JSON.parse(data.responseText);
   });
}

function applyGeoStyle(area, option) {
  area.setStyle(function(feature) {
    if(feature.getProperty("province_iso") != null && BEprovinces.indexOf("BE_"+feature.getProperty("province_iso").substring(3,6))!=-1 && options.indexOf(option)!=-1) {
      var color = gradientColour(option, avrJSON[feature.getProperty("province_iso")][option]);
    }
    else if (feature.getProperty("shn") != null && feature.getProperty("shn") in avrJSONRegio && options.indexOf(option)!=-1){
      var color = gradientColour(option, avrJSONRegio[feature.getProperty("shn")][option]);
    }
    else {
      var color = "gray";
    }
    return /** @type {google.maps.Data.StyleOptions} */({
      fillColor: color,
      strokeColor: "gray",
      strokeWeight: 2,
      fillOpacity: 0.4
    });
  });
}

function applyGeoEvents(area) {
  area.addListener('mouseover', function(event) {

    if(!(mode==="regioMode")) area.revertStyle();

    area.overrideStyle(event.feature, {strokeWeight: 8});

    if(mode=="countryMode" || mode=="provinceMode") {
      //SHOW INFO ABOUT PROVINCE VALUE
      var average = null;
      var name = "";
      if(mode=="countryMode") {
        average = avrJSON["BE-"+event.feature.getProperty("province_iso").substring(3,6)][aq_parameter_select.value];
        name = event.feature.getProperty("varname_2");
      }
      else if (mode=="provinceMode") {
        if(event.feature.getProperty("shn") in avrJSONRegio) average = avrJSONRegio[event.feature.getProperty("shn")][aq_parameter_select.value];
        name = event.feature.getProperty("name");
      }

      if(average == null) average = "<em>unknown</em>";
      else average = average.toFixed(2);

      event.feature.infoWindow = new google.maps.InfoWindow({
  		    content: '<h5>'+name+'</h3><div>Average: '+average.toString()+' '+gradients[aq_parameter_select.value].unit+'</div>'
  	  });

      if(mode=="countryMode") {
        event.feature.infoWindow.setPosition(new google.maps.LatLng(event.feature.getProperty("lat"), event.feature.getProperty("long")));
      }
      else if (mode=="provinceMode") {
        var regio = event.feature.getProperty('shn');

        downloadUrl('/getRegioEnvelop?Regio='+regio,function(data) {
          regioEnvelop = data.responseText;
          var geoEnv = new google.maps.Data();
          var bounds = new google.maps.LatLngBounds();
          geoEnv.addGeoJson(JSON.parse(regioEnvelop));

          geoEnv.forEach(function(feature) {
            feature.getGeometry().forEachLatLng(function(point) {
              bounds.extend(point);
            });
          });

          event.feature.infoWindow.setPosition(bounds.getCenter());
        });
      }

  		event.feature.infoWindow.open(map);
    }
  });

  area.addListener('mouseout', function(event) {
    if(!(mode==="regioMode")) {
      area.revertStyle();
    }
    else {
      if(!event.feature.getProperty("selected")) {
        area.overrideStyle(event.feature, {strokeWeight: 2});
      }
    }
    if(mode=="countryMode" || mode=="provinceMode") event.feature.infoWindow.close();
  });
}

function gradientColour(option, value) {
  returnColour = "gray";
  if(value == null) {
    return returnColour;
  }
  var index = calculateGradientIndex(gradients[option].minValue, gradients[option].maxValue, value, gradients[option].colours.length);
  return gradients[option].colours[index];
}

function calculateGradientIndex(minValue, maxValue, value, length) {
  if(value<minValue) return 0;
  if(value>=maxValue) return length-1;
  var step = Math.abs(maxValue-minValue)/(length-2);
  value-=minValue;  //to 0
  return Math.floor(value/step)+1;
}

function addClickEventsTotal(area) {
  var clickEvent = area.addListener('click', function(event) {
    mode = "provinceMode";

    var lat = event.feature.getProperty('lat');
    var long = event.feature.getProperty('long');
    var zoom = event.feature.getProperty('zoom');
    var province_iso = event.feature.getProperty('province_iso');

    geoData[1] = new google.maps.Data();
    var strGeoJson = 'static/geojson/'+province_iso+'.geojson'
    geoData[1].loadGeoJson(strGeoJson);

    provinceQuery = "BE_"+province_iso.substring(3,6);
    if(BEprovinces.indexOf(provinceQuery)!=currentProvince) {
      currentProvince = BEprovinces.indexOf(provinceQuery);

      getRegioAverages(provinceQuery);

      downloadUrl('/getProvinceEnvelop?Province='+provinceQuery,function(data){
        provinceEnvelop = data.responseText;
        var geoEnv = new google.maps.Data();
        var bounds = new google.maps.LatLngBounds();
        geoEnv.addGeoJson(JSON.parse(provinceEnvelop));

        geoEnv.forEach(function(feature) {
          feature.getGeometry().forEachLatLng(function(point) {
            bounds.extend(point);
          });
        });

        addDragEvent(bounds);
      });
    }

    var newLatLng = new google.maps.LatLng(lat,long);

    map.panTo(newLatLng);
    map.setZoom(zoom);

    geoData[0].setMap(null);

    setTimeout(function() {
      applyGeoStyle(geoData[1], aq_parameter_select.value);
      applyGeoEvents(geoData[1]);

      geoData[1].setMap(map);

      document.getElementById("backButton").style.display = toggleDisplay(document.getElementById("backButton").style.display);

      addClickEventsDetail(geoData[1]);
    }, 500);
  });
}

function addClickEventsDetail(area) {
  area.addListener('click', function(event) {

    //visual clean-up
    map.setOptions({minZoom: 0});
    if(event.feature.infoWindow) event.feature.infoWindow.close();
    infoWindow.close();

    var regio = event.feature.getProperty('shn');

    downloadUrl('/getRegioEnvelop?Regio='+regio,function(data){
      regioEnvelop = data.responseText;
      var geoEnv = new google.maps.Data();
      var bounds = new google.maps.LatLngBounds();
      geoEnv.addGeoJson(JSON.parse(regioEnvelop));

      geoEnv.forEach(function(feature) {
        feature.getGeometry().forEachLatLng(function(point) {
          bounds.extend(point);
        });
      });

      //performance reasons
      if(mode=="provinceMode") {
        //Heatmap
        heatDaMap();

        //Markers
        drawMarkers();

        document.getElementById("stationOptions").style.display = toggleDisplay(document.getElementById("stationOptions").style.display);
      }
      mode = "regioMode";

      var center = bounds.getCenter();

      map.panTo(center);
      map.fitBounds(bounds);

      map.setOptions({gestureHandling: 'greedy', minZoom: map.getZoom()});

      geoData[1].forEach(function(feature) {
        if(feature.getProperty("shn") != event.feature.getProperty("shn")) {
          geoData[1].overrideStyle(feature, {strokeColor: "Gray", fillOpacity: 0.3, zIndex: 0, strokeWeight: 2});
          feature.setProperty("selected", false);
        }
        else {
          geoData[1].overrideStyle(feature, {fillOpacity: 0.0, strokeOpacity: 1.0, strokeColor: "Black", strokeWeight: 8, zIndex: 1});
          feature.setProperty("selected", true);
        }
      });
  });
});
}

//Make sure user can move only inside the province.
function addDragEvent(strictBounds) {
  // Remove previous limitations on drag&zoom
  google.maps.event.clearListeners(map, 'dragend');
  // Listen for the dragend event
  google.maps.event.addListener(map, 'dragend', function() {
    if (strictBounds.contains(map.getCenter())) return;

    // We're out of bounds - Move the map back within the bounds

    var c = map.getCenter(),
        x = c.lng(),
        y = c.lat(),
        maxX = strictBounds.getNorthEast().lng(),
        maxY = strictBounds.getNorthEast().lat(),
        minX = strictBounds.getSouthWest().lng(),
        minY = strictBounds.getSouthWest().lat();

    if (x < minX) x = minX;
    if (x > maxX) x = maxX;
    if (y < minY) y = minY;
    if (y > maxY) y = maxY;

    map.panTo(new google.maps.LatLng(y, x));
  });
}

function addSelectControls() {
  var mapControlDiv = document.getElementById("map_control");
  var dataControlDiv = document.getElementById("dataOptions");
  var stationControlDiv = document.getElementById("stationOptions");
  stationControlDiv.style.display = 'none';
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(mapControlDiv);
}

function addBackButton() {
  var backControlDiv = document.getElementById("backButton");
  backControlDiv.style.display = 'none';
  backControlDiv.addEventListener('click', function() {
    if(mode=="provinceMode") {
      mode="countryMode";
      backControlDiv.style.display = toggleDisplay(backControlDiv.style.display);

      geoData[1].setMap(null);
      geoData[0].setMap(map);

      remodelMap();

      map.panTo(new google.maps.LatLng(50.52045, 4.44878));
      map.setZoom(8.3);
    }
    else if (mode=="regioMode") {
      mode="provinceMode";
      //disable dragging/zooming
      map.setOptions({gestureHandling: 'none', minZoom: 0});
      //zoom to province
      geoData[0].forEach(function(feature) {
        if(feature.getProperty("province_iso").substring(3,6)===BEprovinces[currentProvince].substring(3,6)) {
          var newLatLng = new google.maps.LatLng(feature.getProperty("lat"),feature.getProperty("long"));
          map.panTo(newLatLng);
          map.setZoom(feature.getProperty("zoom"));
        }
      });
      //hide markers
      for(marker in markers) {
        markers[marker].setMap(null);
      }
      //hide heatmaps
      for(heatmap in heatmaps) {
        heatmaps[heatmap].setMap(null);
      }
      //revert styling
      geoData[1].revertStyle();
      //toggle stationSelection
      document.getElementById("stationOptions").style.display = toggleDisplay(document.getElementById("stationOptions").style.display);
    }
  });
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(backControlDiv);
}

function toggleDisplay(display) {
  display = display==='none' ? '' : 'none';
  return display;
}

function changeGradient(option) {
  // STEP 1
  //changeTitle
  var gradientTitleDiv = document.getElementById("gradientTitle");
  while (gradientTitleDiv.firstChild) {
    gradientTitleDiv.removeChild(gradientTitleDiv.firstChild);
  }
  var newTitle = option.charAt(0).toUpperCase() + option.slice(1);
  gradientTitleDiv.appendChild(document.createTextNode(newTitle));

  //changeUnit
  var unitDiv = document.getElementById("unit");
  while (unitDiv.firstChild) {
    unitDiv.removeChild(unitDiv.firstChild);
  }
  var newUnit = "["+gradients[option].unit+"]";
  unitDiv.appendChild(document.createTextNode(newUnit));

  // STEP 2
  //dynamically create gradient-rows
  var gradientDiv = document.getElementById("gradient");
  gradientDiv.classList.forEach(function(entry) {
    if(entry!="col-md-7") gradientDiv.classList.remove(entry);
  });
  gradientDiv.classList.add(""+option.toString());


  //remove previous gradient
  while (gradientDiv.firstChild) {
    gradientDiv.removeChild(gradientDiv.firstChild);
  }

  for(colourInterval in gradients[option].colours) {
    // create a new div element of class 'row colourInterval'
    var row = document.createElement("div");
    row.className = ("row colourInterval");
    // create a new div element of class 'col'
    var col = document.createElement("div");
    col.className = ("col");
    // and give it some content -> REMARK: to top (gradient) => length-count-1
    var interval = document.createTextNode(determineIntervalText(gradients[option], gradients[option].colours.length - colourInterval - 1));
    // add the text node to the newly created div
    col.appendChild(interval);
    // add the col node to the newly created row
    row.appendChild(col);

    gradientDiv.appendChild(row);
  }
}

function addGradientCard() {
  var gradientCardDiv = document.getElementById("gradientCard");
  map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(gradientCardDiv);
}

function determineIntervalText(gradient, count) {
  if(count == 0) {                                     // (-inf ; minValue)
    return "( -∞ ; "+gradient.minValue.toString()+" )";
  }
  else if (count == (gradient.colours.length-1)) {   // [maxValue ; +inf)
    return "[ "+gradient.maxValue.toString()+" ; +∞ )";
  }
  else {                                              // [minValue+step*(count-1) ; minValue+step*count)
    var step = Math.abs(gradient.maxValue-gradient.minValue)/(gradient.colours.length-2);
    var lowerBound = gradient.minValue+step*(count-1);
    var upperBound = gradient.minValue+step*count;
    return "[ "+lowerBound.toString()+" ; "+upperBound.toString()+" )";
  }
}

// Google Charts
// Input 'dataPoints_array': an array containing all the necessary dataPoints
function drawDashboard(dataTable) {
      var parameter = aq_parameter_select.value;


      // Create divs
      var dashboard_div = document.createElement('div');
      dashboard_div.id = "dashboard_div";
      var filter_div = document.createElement('div');
      filter_div.id = "filter_div";
      var chart_div = document.createElement('div');
      chart_div.id = "chart_div";

      dashboard_div.appendChild(chart_div);
      dashboard_div.appendChild(filter_div);


      var chartOptions = {
        width: 480,
        height: 150,
        pointSize: 3,
        chartArea: {
          'left': '10%',
          'width': '90%',
          'height': '80%'
        },
        dataOpacity: 0.3,
        focusTarget: 'category',
        hAxis: {
          gridlines: {
            color: 'none'
          },
          textPosition: 'bottom',
          format: 'MMM dd',
          slantedText: false
        },
        vAxis: {
          title: parameter,

        },
        animation: {
          duration: 500,
          easing: 'out',
        }
      };


      // Create a view from the underlying dataTable
      var parameter_index = parameter_to_index[parameter];
      var view = new google.visualization.DataView(dataTable);
      view.setColumns([0,parameter_index])

      // Create Scatter Chart
      var scatterChart = new google.visualization.ChartWrapper({
        chartType: 'ScatterChart',
        containerId: 'chart_div',
        options: chartOptions
      });

      // Create a date range slider
      var myDateSlider = new google.visualization.ControlWrapper({
        controlType: 'ChartRangeFilter',
        containerId: 'filter_div',
        options: {
          filterColumnLabel: 'Date Range',
          width: 480,
          height: 80,
          pointSize: 3,
          ui: {
            chartType: 'ScatterChart',
            chartOptions: {
              height: 80,
              chartArea: {
              //  left: 5,
                width: '95%',
              //  height: 80
              },
              curveType: 'function'
            },

            // 1 day in milliseconds = 24 * 60 * 60 * 1000 = 86,400,000
            minRangeSize: 86400000
          }
        },
      });

      var dashboard = new google.visualization.Dashboard(dashboard_div);
      dashboard.bind(myDateSlider,scatterChart);

      // Prepare infoWindow and draw dashboard
      var node = document.createElement('div');
      node.id = "infowindow_div";
      var title_p = document.createElement('p');
      title_p.id = "title_p";
      title_p.innerHTML = "Local Statistics";
      node.appendChild(title_p);
      node.appendChild(dashboard_div);

      infoWindow.setContent(node);
      dashboard.draw(view);
}



function remodelMap() {
      var parameter = aq_parameter_select.value;

      changeGradient(parameter);

      if(mode=="regioMode") {
        for(var i = 0; i < heatmaps.length; i++) {
              if (heatmaps[i].name == parameter) {
                   heatmaps[i].setMap(map);
              } else {
                   heatmaps[i].setMap(null);
              }
        }
      }

      if(mode=="countryMode") {
        applyGeoStyle(geoData[0], parameter);
      }
      else {
        applyGeoStyle(geoData[1], parameter);
      }

}


function downloadUrl(url, callback) {
      var request = window.ActiveXObject ?
          new ActiveXObject('Microsoft.XMLHTTP') :
          new XMLHttpRequest;

      request.onreadystatechange = function() {
            if (request.readyState == 4) {
              request.onreadystatechange = doNothing;
              callback(request, request.status);
            }
      };

      request.open('GET', url, true);
      request.send(null);
}

function doNothing() {}
