const cors = require('cors');
const express = require("express");
const _ = require('lodash');
const bodyParser = require("body-parser");
const {MongoClient} = require("mongodb");

//default port if not specified as ENVIRONMENT variable to expose API
const port = process.env.APP_PORT || 5900;
// Database host, port, username, password and auth_db
const dbhost = process.env.DB_HOSTNAME || 'localhost';
const dbport = process.env.DB_PORT || '27017';
const dbusername = process.env.DB_USERNAME || 'ibis';
const dbpassword = process.env.DB_PASSWORD || 'somePassword';
const dbauth = process.env.DB_AUTH || 'zivotinje';
const connectionStringURI = `mongodb://${dbusername}:${dbpassword}@${dbhost}:${dbport}/?authSource=${dbauth}`;
const connectionOptions = {
  connectTimeoutMS: 2000,
  serverSelectionTimeoutMS: 2000
};
const mongoClient = new MongoClient(connectionStringURI, connectionOptions);

const app = express();

// Middleware za parsiranje HTTP Body-ja kao JSON object-a.
app.use(bodyParser.json());
// Allow Cross-Origin requests for all requests
app.use(cors());

// GET api/v1/cats -> listamo sve macke
app.get("/api/v1/cats", (req, res) => {
  console.log('Request is GET /api/v1/cats');
  //pokusaj konektovanja na bazu:
  mongoClient.connect().then((dbClient) => {
    const db = dbClient.db("zivotinje");
    const catsCollection = db.collection("macke");
    const catsArray = [];
    catsCollection.find().forEach(cat => {
      const catObj = _.pick(cat,['name','type','lives_left']);
      catsArray.push(catObj);
    }).then((success) => {
      res.status(200).setHeader('Content-Type', 'application/json').send(catsArray);
      dbClient.close();
    }, error =>{
      console.log("Greska prilikom citanja podataka");
      res.status(500).send(`Greska prilikom citanja podataka: ${error.message}`);
      dbClient.close();
    });
  }, (err) => {
    console.log ("Neuspešno povezivanje na bazu!");
    console.log (`${err.message}`)
    res.status(500).send("Povezivanje sa bazom nemoguće :(");
  });
});

// GET api/v1/cat/:catname -> trazimo macku po imenu
app.get("/api/v1/cat/:catname", (req, res) => {
  console.log(`Request is GET /api/v1/cat/${req.params.catname}`);
  //query obj po imenu
  const queryObj = {
    "name": `${req.params.catname}`
  };

  mongoClient.connect().then((dbClient) => {
    const db = dbClient.db("zivotinje");
    const catsCollection = db.collection("macke");
    catsCollection.findOne(queryObj)
    .then( catObject => {
      const catObj = _.pick(catObject,['name','type','lives_left']);
      res.status(200).setHeader('Content-Type', 'application/json').send(catObj);
    })
    .catch(err => {
      console.log ("Greska prilikom izvlacenja objekta iz baze!");
      console.log (`${err.message}`)
      res.status(500).send("Greska prilikom izvlacenja objekta iz baze :(");
    });
  }, (err) => {
    console.log ("Neuspešno povezivanje na bazu!");
    console.log (`${err.message}`)
    res.status(500).send("Povezivanje sa bazom nemoguće :(");
  });
});

// DELETE api/v1/cat/:catname -> brisemo macku po imenu
app.delete("/api/v1/cat/:catname", (req, res) => {
  console.log(`Request is DELETE /api/v1/cat/${req.params.catname}`);
  //query obj po imenu
  const queryObj = {
    "name": `${req.params.catname}`
  };

  mongoClient.connect().then((dbClient) => {
    const db = dbClient.db("zivotinje");
    const catsCollection = db.collection("macke");
    catsCollection.findOneAndDelete(queryObj)
    .then( deletedCat => {
        const catObj = _.pick(deletedCat?.value,['name','type','lives_left']);
        res.status(200).setHeader('Content-Type', 'application/json').send(catObj);
    })
    .catch(err => {
      console.log ("Greska prilikom pronalaženja objekta u baze!");
      console.log (`${err.message}`)
      res.status(500).send("Greska prilikom pronalaženja objekta u baze");
    });
  }, (err) => {
    console.log ("Neuspešno povezivanje na bazu!");
    console.log (`${err.message}`)
    res.status(500).send("Povezivanje sa bazom nemoguće :(");
  });
});

// POST api/v1/cat -> Upisujemo novu macku u bazu podataka
app.post("/api/v1/cat", (req, res) => {
  console.log(`Request is POST /api/v1/cat`);
  console.log(`Request body is:\n ${JSON.stringify(req.body,null,2)}`);
  const reqBody = req.body;

  if(_.has(reqBody,'name') && _.has(reqBody, 'type') && _.has(reqBody, 'lives_left') && _.isNumber(req.body.lives_left)){
    objectToInsert = _.pick(reqBody,['name','type','lives_left']);
    //Posto je objekat validan
    mongoClient.connect().then((dbClient) => {
      const db = dbClient.db("zivotinje");
      const catsCollection = db.collection("macke");
      catsCollection.insertOne(objectToInsert)
      .then( insertedObject => {
        res.status(200).setHeader('Content-Type', 'application/json').send(objectToInsert);
      })
      .catch(err => {
        console.log ("Greska prilikom upisivanja objekta u bazu!");
        console.log (`${err.message}`)
        res.status(500).send("Greska prilikom upisivanja objekta u bazu :(");
      });
    }, (err) => {
      console.log ("Neuspešno povezivanje na bazu!");
      console.log (`${err.message}`)
      res.status(500).send("Povezivanje sa bazom nemoguće :(");
    });
  }else{
    res.status(500).setHeader('Content-Type', 'application/json').send("Bad Format of request object!");
  }
});

// PUT api/v1/cat/:catname -> Editujemo macku po imenu
app.put("/api/v1/cat/:catname", (req, res) => {
  console.log(`Request is PUT /api/v1/cat/${req.params.catname}`);
  console.log(`Request body is:\n ${JSON.stringify(req.body,null,2)}`);
  const reqBody = req.body;
  //query obj po imenu
  const filterObj = {
    "name": `${req.params.catname}`
  };
  if(_.has(reqBody,'name') && _.has(reqBody, 'type') && _.has(reqBody, 'lives_left') && _.isNumber(req.body.lives_left)){
    const objectToreplace = _.pick(reqBody,['name','type','lives_left']);
    const newValue = {$set: objectToreplace};
    mongoClient.connect().then((dbClient) => {
      const db = dbClient.db("zivotinje");
      const catsCollection = db.collection("macke");
      catsCollection.updateOne(filterObj,newValue)
      .then( updatedCat => {
          //returns the acknowledgement object
          res.status(200).setHeader('Content-Type', 'application/json').send(updatedCat);
      })
      .catch(err => {
        console.log ("Greska prilikom update-a objekta u bazi!");
        console.log (`${err.message}`)
        res.status(500).send("Greska prilikom update-a objekta u bazi");
      });
    }, (err) => {
      console.log ("Neuspešno povezivanje na bazu!");
      console.log (`${err.message}`)
      res.status(500).send("Povezivanje sa bazom nemoguće :(");
    });


  } else {
    res.status(500).setHeader('Content-Type', 'application/json').send("Bad Format of request object!");
  }
});


// Set Port from ENV variables or if not existant on >7000
app.set("port", port);
console.log(`Port variable is ${port}`);
app.listen(app.get("port"), function() {
  console.log("Server started on port " + app.get("port"));
});
