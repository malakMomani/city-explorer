'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const yelp = require('yelp-fusion');


const { query, response } = require('express');


const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const PORT = process.env.PORT;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const PARK_API_KEY = process.env.PARK_API_KEY;
const MOVIE_API_KEY = process.env.MOVIE_API_KEY;
const REST_API_KEY = process.env.REST_API_KEY;

const app = express();
app.use(cors());

// const client = new pg.Client({
//   connectionString: DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false
//   }
// });

const client = new pg.Client(DATABASE_URL);

app.get('/', (req, res) => {
  res.status(200).send('All Good');
});


app.get('/location', handleLocationRequest);
app.get('/weather', handleWeatherRequest);
app.get('/park', handleParkRequest);
app.get('/movies', handleMoviesRequest);
app.get('/restaurant', handleRestRequest);

function handleRestRequest(req, res) {
  let location = req.query.search;
  const url = `https://api.yelp.com/v3/businesses/${location}`;
}


function handleMoviesRequest(req, res) {
  const q = req.query.query;

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_API_KEY}&query=${q}&limit=20`
  superagent.get(url).then(result => {
    const movies = result.body.results.map(movie => {
      return new Movie(movie);
    });
    res.status(200).send(movies);
  }).catch(error => {
    res.status(404).send(error);
  });

}

function Movie(movieData) {
  this.title = movieData.title;
  this.overview = movieData.overview;
  this.average_votes = movieData.vote_average;
  this.total_votes = movieData.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500${movieData.backdrop_path}`;
  this.popularity = movieData.popularity;
  this.released_on = movieData.release_date;
}
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
          }).catch(error => {
            console.log('ERROR in insert query', error);
          });
        }).catch(error => {
          console.log("ERROR in API", error);
        });
      }
      else {
        res.status(200).send(selectresult.rows);
      }
    }).catch(error => {
      console.log("ERROR in select query", error);
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
    //console.log(resData);
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
  res.send('sth wrong');
});
client.connect().then(() => {
  app.listen(PORT, () => {
    console.log('Connected to database', client.connectionParameters.database);
    console.log('Listening to port ', PORT);
  });
});
//app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));