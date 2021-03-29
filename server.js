'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const { query, response } = require('express');

let locationInfo = {};
let cityName = '';

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const PORT = process.env.PORT;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const cityQueryParam = {
  key: GEOCODE_API_KEY,
  q: cityName,
  format: 'json'
};
const app = express();
app.use(cors());

app.get('/location', handleLocationRequest);
app.get('/weather', handleWeatherRequest);
app.use('*', handleError)


function handleLocationRequest(req, res) {
  //res.send('location');
  cityName = req.query.city;
  //const url = "https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${query}&format=json";
  const url = 'https://us1.locationiq.com/v1/search.php';
  if (!cityName) {
    res.status(404).send('Sorry, No city was found !!');
  }

  superagent.get(url).query(cityQueryParam).then(resdata => {
    locationInfo = new Location(cityName, resdata.body[0]);
    res.status(200).send(locationInfo);
  }).catch((error) => {
    console.log('ERROR', error);
    res.send('Sorry, something went wrong');
  });


  // const locationData = require('./data/location.json');
  // const location = new Location(locationData[0], query);
  // res.send(location);
}

function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData.display_name;
  this.latitude = geoData.lat;
  this.longitude = geoData.lon;

}

function handleWeatherRequest(req, res) {

  // const weatherData = require('./data/weather.json');
  const url = `https://api.weatherbit.io/v2.0/current?lat=${locationInfo.latitude}&lon=${locationInfo.longitude}&key=${WEATHER_API_KEY}`;
  const weathers = [];


  superagent.get(url).then(resdata => {
    resdata.map(weather =>{
      weathers.push(new Weather(weather));
    });
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