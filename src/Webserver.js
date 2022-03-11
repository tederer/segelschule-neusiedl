/* global segelschule, process */
require('./logging/LoggingSystem.js');
require('./Version.js');

var LOGGER                 = segelschule.logging.LoggingSystem.createLogger('Webserver');
var MILLIS_PER_SECOND      = 1000;
var POLLING_INTERVAL       = 10  * MILLIS_PER_SECOND;
var STOP_POLLING_TIMEOUT   = 120 * MILLIS_PER_SECOND;
var DEFAULT_PORT           = 80;

var express                = require('express');
var https                  = require('https');
var configuredlogLevel     = process.env.LOG_LEVEL;
var sensorUrl              = process.env.SENSOR_URL;
var sensorId               = process.env.SENSOR_ID;
var apiKey                 = process.env.API_KEY;
var webserverPort          = process.env.WEBSERVER_PORT;
var allowedOrigin          = process.env.ALLOWED_ORIGIN;
var app                    = express();

var windAverages;
var windHistory;
var intervalId;
var stopPollingTimeoutId;

var logLevel = segelschule.logging.Level.INFO;
if (configuredlogLevel !== undefined && segelschule.logging.Level[configuredlogLevel] !== undefined) {
   logLevel = segelschule.logging.Level[configuredlogLevel];
}
segelschule.logging.LoggingSystem.setMinLogLevel(logLevel);
LOGGER.logInfo('log level = ' + logLevel.description);

var info = {
    version:    segelschule.getVersion(),
    start:      (new Date()).toISOString()
};

if (typeof info.version === 'string') {
    LOGGER.logInfo('version = ' + info.version);
} else {
    LOGGER.logError('failed to evaluate version: ' + info.version.message);
}

var assertValidSensorUrl = function assertValidSensorUrl() {
   if (sensorUrl === undefined || sensorUrl.length == 0) {
      LOGGER.logError('No sensor URL configured! Please provide it via the environment variable called SENSOR_URL.');
      process.exit(1);
   }
};

var assertValidSensorId = function assertValidSensorId() {
    if (sensorId === undefined) {
        LOGGER.logError('No sensor ID configured! Please provide it via the environment variable called SENSOR_ID.');
        process.exit(1);
    }
    if (sensorId.match(/^[1-9][0-9]{4}$/) === null) {
        LOGGER.logError('Wrong format of sensor ID "' + sensorId + '". Expected format = [1-9][0-9]{5}');
        process.exit(1);
    }
};

var assertValidApiKey = function assertValidApiKey() {
   if (apiKey === undefined || apiKey.length == 0) {
      LOGGER.logError('No api key configured! Please provide it via the environment variable called API_KEY.');
      process.exit(1);
   }
};

var poll = function poll(url, consumerCallback, description) {
   LOGGER.logDebug('polling ' + description + ' ...');
   var request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
         LOGGER.logError('failed to poll "' + url + '" [statusCode=' + response.statusCode + ', statusMessage=' + response.statusMessage + ']');
      } else {
         var rawData = '';
         response.setEncoding('utf8');
         response.on('error', (error) => LOGGER.logError('failed to poll ' + description + ': ' + error.toString()));
         response.on('data', (chunk) => rawData += chunk);
         response.on('end', (chunk) => {
            try {
               consumerCallback(JSON.parse(rawData));
               LOGGER.logInfo('polled ' + description + ' successfully');
            } catch(e) {
               LOGGER.logError('failed to parse "' + rawData + '" because of ' + e.toString());
            }
         });
      }
   });

   request.on('error', (error) => LOGGER.logError('failed to poll averages: ' + error.toString()));
};

var pollAverages = function pollAverages() {
   var url = sensorUrl + '/windsensor/' + sensorId;
   poll(url, data => windAverages = data, 'averages');
};

var pollHistory = function pollHistory() {
   var url = sensorUrl + '/windsensor/history/' + sensorId;
   poll(url, data => windHistory = data, 'history');
};

var pollData = function pollData() {
   pollAverages();
   pollHistory();
};

var startPeriodicPolling = function startPeriodicPolling() {
   if (intervalId === undefined) {
      LOGGER.logInfo('starting polling ...');
      pollData();
      intervalId = setInterval(pollData, POLLING_INTERVAL);
   }
};

var stopPeriodicPolling = function stopPeriodicPolling() {
   if (intervalId !== undefined) {
      LOGGER.logInfo('stopping polling ...');
      clearInterval(intervalId);
      intervalId = undefined;
   }
};

var stopPollingTimeoutExpired = function stopPollingTimeoutExpired() {
   LOGGER.logInfo('no request received for ' + STOP_POLLING_TIMEOUT + 'ms -> polling not longer needed ...');
   stopPeriodicPolling();
   stopPollingTimeoutId = undefined;
};

var restartStopPollingTimeout = function restartStopPollingTimeout() {
   if (stopPollingTimeoutId !== undefined) {
      clearTimeout(stopPollingTimeoutId);
   }
   stopPollingTimeoutId = setTimeout(stopPollingTimeoutExpired, STOP_POLLING_TIMEOUT);
};

var asynchronuouslyUpdateDataIfNecessary = function asynchronuouslyUpdateDataIfNecessary() {
   restartStopPollingTimeout();
   startPeriodicPolling();
};

var apiKeyIsCorrect = function apiKeyIsCorrect(request) {
   var apiKeyInRequest = (request.query !== undefined) ? request.query.apikey : undefined;
   var keyIsCorrect = apiKeyInRequest === apiKey;
   if (!keyIsCorrect) {
      LOGGER.logDebug('request with invalid apiKey "' + apiKeyInRequest + '"');
   }
   return keyIsCorrect;
};

var sendData = function sendData(request, response, dataSupplier) {
   LOGGER.logDebug('GET request [path: ' + request.path + ']');
   
   if (apiKeyIsCorrect(request)) {
      asynchronuouslyUpdateDataIfNecessary();
      var data = dataSupplier();
      var origin = request.get('origin');
      if ((allowedOrigin !== undefined) && (origin !== undefined)) {
         try {
            var originUrl = new URL(origin);
            if (originUrl.hostname.endsWith(allowedOrigin)) {
               response.append('Access-Control-Allow-Origin', origin);
            }
         } catch(e) {}
      }
      response.status(200).json(data !== undefined ? data : {});
   } else {
       response.status(400).send('invalid request');
   }
};

assertValidSensorUrl();
assertValidSensorId();
assertValidApiKey();

LOGGER.logInfo('sensor URL     = ' + sensorUrl);
LOGGER.logInfo('sensor ID      = ' + sensorId);
LOGGER.logInfo('API key        = ' + apiKey);
if (allowedOrigin !== undefined) {
LOGGER.logInfo('allowed origin = ' + allowedOrigin);   
}

app.get(/\/windsensor\/averages/, (request, response) => sendData(request, response, () => windAverages));

app.get(/\/windsensor\/history/, (request, response) => sendData(request, response, () => windHistory));

app.get(/\/info/, (request, response) => {
    LOGGER.logDebug('GET request [path: ' + request.path + ']');
    response.status(200).json(info);
});

var port = webserverPort === undefined ? DEFAULT_PORT : webserverPort;

app.listen(port, () => {
   LOGGER.logInfo('server listening on port ' + port);
});
