'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT;
const app = express();
app.use(cors());

app.get('/location', handleLocationRequest);
app.get('/weather', handleWeatherRequest);

function handleLocationRequest(req, res) {
  //res.send('location');
  const locationData = require('./data/location.json');
  const location = new Location(locationData[0]);
  res.send(location);
}

function Location(data) {
  this.name = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;

}

function handleWeatherRequest() {
  const weatherData = require('./data/weather.json');
  const weathers= [];

  weatherData.data.forEach(weather =>{
    weathers.push(new Weather(weather));
  });

}

function Weather(data){

}

app.use('*', (req, res) => {
  res.send('Test');
});

app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));