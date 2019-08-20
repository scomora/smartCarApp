'use strict';

const cors = require('cors');
const express = require('express');
const smartcar = require('smartcar');
const path = require('path');
const bodyParser = require('body-parser');





const app = express()
  .use(cors());
const port = 8000;
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({extended: true}));


const client = new smartcar.AuthClient({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
  scope: ['required:control_security:lock', 'required:control_security:unlock', 'read_location'],
  testMode: true,
});


// TODO: Authorization Step 1a: Launch Smartcar authentication dialog

// global variable to save our accessToken
let access;

app.get('/loginPage', function(req, res) {
  res.render('login');
})
app.get('/login', function(req, res) {
  // TODO: Authorization Step 1b: Launch Smartcar authentication dialog
  const link = client.getAuthUrl();
  //console.log(client);
  //console.log(link);
  res.redirect(link);
});

//when get /loginSuccessful render a page with their name

app.get('/exchange', function(req, res) {
  // TODO: Authorization Step 3: Handle Smartcar response
  const code = req.query.code;
  //console.log(res);
  // TODO: Request Step 1: Obtain an access token
  return client.exchangeCode(code)
    .then(function(_access) {    
      // in a production app you'll want to store this in some kind of persistent storage
      access = _access;

      //res.sendStatus(200);
      res.render('home');

    })
  // TODO: Request Step 1: Obtain an access token
});

app.get('/vehicle', function(req, res) {
  // TODO: Request Step 2: Get vehicle ids
  return smartcar.getVehicleIds(access.accessToken)
  .then(function(data) {
    // the list of vehicle ids
    return data.vehicles;
  })
  .then(function(vehicleIds) {
    // instantiate the first vehicle in the vehicle id list
    const vehicle = new smartcar.Vehicle(vehicleIds[0], access.accessToken);

    // TODO: Request Step 4: Make a request to Smartcar API
    return vehicle.info();
  })
  .then(function(info) {
    //console.log(info);
    // {
    //   "id": "36ab27d0-fd9d-4455-823a-ce30af709ffc",
    //   "make": "TESLA",
    //   "model": "Model S",
    //   "year": 2014
    // }

    res.json(info);
  });
  // TODO: Request Step 3: Create a vehicle

  // TODO: Request Step 4: Make a request to Smartcar API
});

app.post('/findDistance', function (req, res) {
  //AIzaSyCkt-AFdDeh29cWQe0riiEy1X2C5x5iMvo
  return smartcar.getVehicleIds(access.accessToken)
  .then(function(data) {
    // the list of vehicle ids
    return data.vehicles;
  })
  .then(function(vehicleIds) {
    // instantiate the first vehicle in the vehicle id list
    const vehicle = new smartcar.Vehicle(vehicleIds[0], access.accessToken);

    // TODO: Request Step 4: Make a request to Smartcar API
    return vehicle.location();
  })
  .then(function(location) {
    //load new google map; use location.data.latitude and location.data.longitude
    //create key-value pairs between city names and their associated lats and longs
    //console.log(req);
    var city = req.body.cities;
    //console.log("city = " + city);
    var cityLat = getLat(city);
    var cityLong = getLong(city);
    var currLat = location.data.latitude;
    var currLong = location.data.longitude;
    var dKm = calculateDistance(cityLat, cityLong, currLat, currLong);
    var dMi = km2mi(dKm);
    city = city.charAt(0).toUpperCase() + city.slice(1);
    console.log("your lat = " + currLat + "your long = " + currLong);
    res.render('distance', {dKm: dKm,
                            dMi: dMi,
                            city: city}
              );
    
    
  })
})

app.get('/lockCar', function(req, res) {
  return smartcar.getVehicleIds(access.accessToken)
  .then(function(data) {
    // the list of vehicle ids
    return data.vehicles;
  })
  .then(function(vehicleIds) {
    // instantiate the first vehicle in the vehicle id list
    const vehicle = new smartcar.Vehicle(vehicleIds[0], access.accessToken);

    // TODO: Request Step 4: Make a request to Smartcar API
    return vehicle.lock();
  })
  .then(function(lock) {
    res.render('locked');
    //res.json(lock);
  })
  
})

app.get('/unlockCar', function(req, res) {
  return smartcar.getVehicleIds(access.accessToken)
  .then(function(data) {
    // the list of vehicle ids
    return data.vehicles;
  })
  .then(function(vehicleIds) {
    // instantiate the first vehicle in the vehicle id list
    const vehicle = new smartcar.Vehicle(vehicleIds[0], access.accessToken);

    // TODO: Request Step 4: Make a request to Smartcar API
    return vehicle.unlock();
  })
  .then(function(unlock) {
    res.render('unlocked');
    //res.json(unlock);ƒconsole
  })
  
})



const cityLocations = {
  "berlin": {
    "latitude": 52,
    "longitude": 30
  },
  "shanghai": {
    "latitude": 31,
    "longitude": 10
  },
  "sanfrancisco": {
    "latitude": 38,
    "longitude": 122
  },
  "miami": {
    "latitude": 26,
    "longitude": 80
  },
  "telaviv": {
    "latitude": 32,
    "longitude": 35
  }

};

//radius of earth (km)
const R = 6371;

//function to convert an angle from degrees to radians
function deg2rad(deg) {
  return deg * (Math.PI/180);
}

function getLat(city) {
  return cityLocations[city]["latitude"];
}

function getLong(city) {
  return cityLocations[city]["longitude"];
}

function calculateDistance(cityLat, cityLong, currLat, currLong) {
  var dLat = deg2rad(currLat - cityLat);
  var dLong = deg2rad(currLong - cityLong);
  var a = 
  Math.sin(dLat/2) * Math.sin(dLat/2) +
  Math.cos(deg2rad(cityLat)) * Math.cos(deg2rad(cityLong)) *
  Math.sin(dLong/2) * Math.sin(dLong/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
return R * c;
}

function km2mi(km) {
  return km * 0.621371;
}
app.listen(port, () => console.log(`Listening on port ${port}`));
