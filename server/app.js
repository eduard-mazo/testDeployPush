'use strict';

var MongodbMemoryServer = require('mongodb-memory-server');
var {MongoClient, ObjectID} = require('mongodb');
var path = require('path');
var port = (process.argv[2] && process.argv[2].substr(process.argv[2].indexOf('=') + 1)) || 8300;
var express = require('express');
var bodyParser = require('body-parser');
var cookieSession = require('cookie-session');
var SESSION_SECRET = 'ooo sooo secret string!!!! super secret!!! dont touch me!!';
var creatingCollections = require('./lib/userMockData');


(async function setupDatabase(webserverCallback) {
  var mongod = new MongodbMemoryServer.default({});
  var dbUri = await mongod.getConnectionString();
  var dbName = await mongod.getDbName();
  var connection = await MongoClient.connect(dbUri, {keepAlive: true, connectTimeoutMS: 30000, useNewUrlParser: true});
  try {
    var db = await connection.db(dbName);
    await creatingCollections(ObjectID, db);
    webserverCallback(db);
  } catch (error) {
    console.log('Some error: ', error);
  }
})(async function webserverCallback(client) {
  var userIndex = require('./lib/userRecord')(client, ObjectID);
  var userRoute = require('./routes/user')(userIndex);
  var pushMngrRoute = require('./routes/pushMngr')(userIndex);
  var app = express();

  app.set('port', port);
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieSession({name: 'cs', secret: SESSION_SECRET, httpOnly: false}));
  app.use(express.static(path.join(__dirname, '../client')));
  app.use('/sw.js', function fcnSw(req, res) {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(__dirname, '/client/sw.js'));
  });

  app.get('/', function fcnIndex(req, res) {
    if (!userIndex.existID(req.session.ref)) {
      req.session = null;
    }
    res.sendFile(path.join(__dirname, '../client/template.html'));
  });

  app.post('/user/login', userRoute.login);
  app.post('/user/subcription/:type', userRoute.checkAuth, pushMngrRoute.subscribe);
  app.post('/user/sendPush/:type', userRoute.checkAuth, pushMngrRoute.sendPushNotification);
  app.post('/user/devices/:type', userRoute.checkAuth, pushMngrRoute.devices);

  app.post('/sw/pushDelivery', pushMngrRoute.clientPushConfirmation);

  await userIndex.buildUserIndex(); // Prepare the users before start the server.
  app.listen(port, function fcnListen(er) {
    if (er) {
      client.close();
    } else {
      console.log('Express server listening on port ' + app.get('port'));
    }
  });
});
