/**
 * Perform XMLHttpRequest.
 */
var xhrRequest = function (url, type, body, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    callback(this.responseText);
  };
  xhr.open(type, url);
  xhr.setRequestHeader('Content-Type', 'text/xml;charset=UTF-8');
  xhr.send(body);
};

/**
 * Get XML element value.
 *
 * Using RegExp on responseText, as responseXML isn't supported.
 */
var getXmlValue = function(name, xml) {
  var regex = new RegExp('<' + name + '>(.*?)</' + name + '>', 'g');  
  var matches = xml.match(regex);
  var values = [];
  for (i in matches) {
    var value = matches[i].replace(regex, '$1');
    values.push(value);
  }
  return values;
};

/**
 * Get departure board.
 */
function getArrivals() {
  // SOAP URL.
  var url = "https://lite.realtime.nationalrail.co.uk/OpenLDBWS/ldb7.asmx";

  // Soap XML.
  var body = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://thalesgroup.com/RTTI/2013-11-28/Token/types" xmlns:ldb="http://thalesgroup.com/RTTI/2015-05-14/ldb/">\
  <soapenv:Header>\
      <typ:AccessToken>\
         <typ:TokenValue>' + localStorage.getItem('api_key') + '</typ:TokenValue>\
      </typ:AccessToken>\
   </soapenv:Header>\
   <soapenv:Body>\
      <ldb:GetDepartureBoardRequest>\
         <ldb:numRows>10</ldb:numRows>\
         <ldb:crs>' + localStorage.getItem('station') + '</ldb:crs>\
      </ldb:GetDepartureBoardRequest>\
   </soapenv:Body>\
  </soapenv:Envelope>';

  // Get arrivals from NRE.
  xhrRequest(url, 'POST', body, function(responseText) {

    // Get service list.
    var services = getXmlValue('lt3:service', responseText);

    // Create list of departures.
    var list = [];

    for (i in services) {
      // Get service item.
      var service = services[i];

      // Create array of parts to be joined with comma.
      var text = [];

      // Destination station.
      var destination = getXmlValue('lt3:destination', service);
      var station = getXmlValue('lt2:locationName', destination[0]);
      // Add via if available.
      var via = getXmlValue('lt3:via', service);
      if (via.length > 0) {
        station += ' ' + via;
      }
      text.push(station);

      // Time.
      var std = getXmlValue('lt3:std', service);
      std += ' (' + getXmlValue('lt3:etd', service) + ')';
      text.push(std);

      // Platform.
      var plat = getXmlValue('lt3:platform', service);
      if (plat.length > 0) {
        text.push('Plat:' + plat); 
      }

      // Add to board list.
      list.push(text.join(', '));
    }

    // Send to Pebble
    Pebble.sendAppMessage({
      'apidata':list.join("\n\n")
    });
  });
}

/**
 * Show config.
 */
Pebble.addEventListener('showConfiguration', function() {
  var url = 'https://rawgit.com/davidgrayston/rail_departures/master/config/index.html';
  Pebble.openURL(url);
});

/**
 * Save config.
 */
Pebble.addEventListener('webviewclosed', function(e) {
  var configData = JSON.parse(decodeURIComponent(e.response));
  localStorage.setItem('station', configData['station']);
  localStorage.setItem('api_key', configData['api_key']);
});

/**
 * Get departures when app is opened.
 */
Pebble.addEventListener('ready', function(e) {
  getArrivals();
});

/**
 * Get departures when an AppMessage is received.
 */
Pebble.addEventListener('appmessage', function(e) {
  getArrivals();
});
