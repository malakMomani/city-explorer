'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const { query } = require('express');

const PORT = process.env.PORT;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

const app = express();
app.use(cors());


const client = new pg.Client(DATABASE_URL);

app.get('/', (req, res) => {
  res.status(200).send('All Good');
});


app.get('/location', handleLocationRequest);
app.use('*', handleError)

// function handleLocationRequest(req, res) {
//   //res.send('location');
//   const city = req.query.city;
//   const queryParam = {
//     key: GEOCODE_API_KEY,
//     q: city,
//     format: 'json'
//   }
//   const url = `https://us1.locationiq.com/v1/search.php`;
//   const value = [city];
//   const sqlQuery = `SELECT * FROM locations search_query = $1`;
//   const dbLocations = client.query(sqlQuery ,value);
//   console.log(dbLocations);
//   let apiLocation = {};

//   superagent.get(url).query(queryParam).then((resData) => {
//     apiLocation = new Location(city, resData.body[0]);
//     //console.log(apiLocation);
//   }).catch(error => {
//     console.log(error);
//   });

//   if (true) {
//     res.status(200).send(apiLocation);

//   } else {
//     const safeValue = [apiLocation.search_query, apiLocation.formatted_query, apiLocation.latitude, apiLocation.longitude];
//     const sqlInsertRow = `INSERT INTO locations(search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4)`;

//     client.query(sqlInsertRow , safeValue).then(result =>{
//       res.status(200).json(result);
//     });
//   }
// }


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
client.connect().then(() => {
  app.listen(PORT, () => {
    console.log('Connected to database', client.connectionParameters.database);
    console.log('Listening to port ', PORT);
  });
});
//app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));