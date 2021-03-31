'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

const { query, response } = require('express');

let locationInfo = {};
let cityName = '';


const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const PORT = process.env.PORT;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const PARK_API_KEY = process.env.PARK_API_KEY;

const app = express();
app.use(cors());


const client = new pg.Client(DATABASE_URL);

app.get('/', (req, res) => {
  res.status(200).send('All Good');
});


app.get('/location', handleLocationRequest);
app.get('/weather', handleWeatherRequest);
app.use('/park', handleParkRequest);

function handleLocationRequest(req, res) {
  const city = req.query.city;
  const selectValue = [city];
  const selectQ = `select * from locations where search_query=$1;`


  if (!city) {
    res.status(404).send('No city provided!!')
  } else {
    client.query(selectQ, selectValue).then(selectresult => {
      if (selectresult.rows.length === 0) {
        getFromAPI(city).then(apiResult => {
          const insertValues = [apiResult.search_query, apiResult.formatted_query, apiResult.latitude, apiResult.longitude];
          const insertQ = `insert into locations (search_query, formatted_query, latitude, longitude) values ($1 ,$2, $3, $4);`
          client.query(insertQ, insertValues).then(insertResult => {
            res.status(200).send(apiResult);
          });
        });
      }
      else {
        res.status(200).send(selectresult.rows);
      }
    });
  }
}


function getFromAPI(city) {
  const queryParam = {
    key: GEOCODE_API_KEY,
    q: city,
    format: 'json'
  }
  const url = `https://us1.locationiq.com/v1/search.php`;
  let apiLocation = {};
  return superagent.get(url).query(queryParam).then(resData => {
    //console.log(resData.body[0]);

    apiLocation = new Location(resData.body[0], city);
    console.log(apiLocation);
    return apiLocation;

  });
}
function Location(data, query) {
  this.search_query = query;
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;


  //res.send('location');
  cityName = req.query.city;
  //const url = "https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${query}&format=json";
  //console.log(cityName);
  const cityQueryParam = {
    key: GEOCODE_API_KEY,
    q: cityName,
    format: 'json'
  };
  console.log(GEOCODE_API_KEY);
  const url = 'https://us1.locationiq.com/v1/search.php';

  if (!cityName) {
    res.status(404).send('Sorry, No city was found !!');
  } else {

    superagent.get(url).query(cityQueryParam).then(resdata => {
      locationInfo = new Location(cityName, resdata.body[0]);
      console.log(locationInfo);
      res.status(200).send(locationInfo);
    }).catch((error) => {
      console.log('ERROR', error);
      res.status(404).send('Sorry, something went wrong');
    });

  }
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

  cityName = req.query.city;
  // const weatherData = require('./data/weather.json');
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?`;

  const queryObject = {
    lat: req.query.latitude,
    lon: req.query.longitude,
    key: WEATHER_API_KEY
  }


  superagent.get(url).query(queryObject).then(resdata => {
    const weatherData = resdata.body.data.map(weather => {
      return new Weather(weather);
    });
    res.send(weatherData);
  }).catch((error) => {
    console.log('ERROR', error);
    res.status(500).send('sth wrong');
  });


}

function Weather(weatherData) {
  this.forecast = weatherData.weather.description;
  this.time = weatherData.datetime;
}

function handleParkRequest(req, res) {

  const url = `https://developer.nps.gov/api/v1/parks?q=${req.query.city}&api_key=${PARK_API_KEY}&limit=10`;

  superagent.get(url).then(resData => {
    //console.log(resData.body);
    const Parks = resData.body.data.map(park => {
      return new Park(park);
    });
    res.send(Parks);
  }).catch(error => {
    console.log('ERROR', error);
    res.status(500).send('sth wrong');
  });
}
function Park(data) {
  this.name = data.name;
  this.address = `${data.adresses[0].linel},${data.adresses[0].city} , ${data.adressess[0].stateCode} , ${data.adrersses[0].postalCode}`;
  this.fee = '0.00';
  this.Park_url = data.url;
}

app.use('*', (req, res) => {
  res.send('Test');
});
client.connect().then(() => {
  app.listen(PORT, () => {
    console.log('Connected to database', client.connectionParameters.database);
    console.log('Listening to port ', PORT);
  });
});
//app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));