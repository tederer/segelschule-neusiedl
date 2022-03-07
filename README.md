# segelschule-neusiedl

This is the frontend used for Segelschule Neusiedl.

## building the Docker image

To build the Docker image execute `buildDockerImage.sh`.

## starting the service (using docker)

For a successful execution of the service you need to set the mandatory environment variables.

|variable        |mandatory|type   |description|
|----------------|---------|-------|-----------|
|SENSOR_URL      |yes      |string|The URL of the [windsensor-service](https://github.com/tederer/windsensor-service) that provides the wind data.|
|SENSOR_ID       |yes      |string|The ID of the windsensor-service.|
|API_KEY         |yes      |string|The key that allows you to use the API of this service.|
|ALLOWED_ORIGIN  |no       |string|The URL provided in the origin request header field for which the CORS response header field shall get set.|
|WEBSERVER_PORT  |no       |integer|The port the webserver shall use (default=80).|
|LOG_LEVEL       |no       |string |one of [DEBUG, INFO, WARNING, ERROR, OFF]|

## Polling the current wind average data

The calculated average values (1min and 10min) can be polled by using a HTTP GET request to `/windsensor/averages?<apiKey>` (don't foregt to replace `<apiKey>` with the apiKey of the service).

The format of the response is the same as described in [windsensor-service](https://github.com/tederer/windsensor-service#output-message-format).

## Polling the current wind history

The wind history can be polled by using a HTTP GET request to `/windsensor/history?<apiKey>` (don't forget to replace `<apiKey>` with the apiKey of the service).

The format of the response is the same as described in [windsensor-service](https://github.com/tederer/windsensor-service#output-message-format).

## Polling container informations

To get the version and the start time of the container, insert the IP address and the port of your container into the following URL and open it in a browser.

    https://<ip-address-of-container>:<port-of-container>/info

## references
[windsensor-service](https://github.com/tederer/windsensor-service)