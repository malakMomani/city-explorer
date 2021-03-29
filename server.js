'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { query } = require('express');

const PORT = process.env.PORT;
const app = express();
app.use(cors());

app.get('/location', handleLocationRequest);
app.get('/weather', handleWeatherRequest);
app.use('*', handleError)

function handleLocationRequest(req, res) {
  //res.send('location');
  const query = req.query.city;
  if(!query) {
    res.status(404).send('Sorry, No city was found !!');
  }
  const locationData = require('./data/location.json');
  const location = new Location(locationData[0], query);
  res.send(location);
}

function Location(data, query) {
  this.search_query = query;
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;

}

function handleWeatherRequest(req, res) {
  const weatherData = require('./data/weather.json');
  const weathers = [];

  weatherData.data.forEach(weather => {
    weathers.push(new Weather(weather));
  });

  res.send(weathers);
}

function Weather(weatherData) {
  this.forecast = weatherData.weather.description;
  this.time = weatherData.datetime;
}

function handleError(req, res) {
  res.status(500).send('Sorry, something went wrong !!');

}

app.use('*', (req, res) => {
  res.send('Test');
});

app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));