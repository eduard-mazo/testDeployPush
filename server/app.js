'use strict';

var MongodbMemoryServer = require('mongodb-memory-server');
var {MongoClient, ObjectID} = require('mongodb');
var path = require('path');
var https = require('https');
var port = (process.argv[2] && process.argv[2].substr(process.argv[2].indexOf('=') + 1)) || 8300;
var express = require('express');
var bodyParser = require('body-parser');
var cookieSession = require('cookie-session');
var SESSION_SECRET = 'ooo sooo secret string!!!! super secret!!! dont touch me!!';
var creatingCollections = require('./userMockData');

var userIndexBy;

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
  var app = express();
  var userAccounts = client.collection('userAccounts');
  await builduserIndexBy();
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
    if (!existID(req.session.ref)) {
      req.session = null;
    }
    res.sendFile(path.join(__dirname, '../client/template.html'));
  });

  app.post('/user/login', login);
  app.post('/user/subcription/:type', checkAuth, subscribe);

  app.listen(port, function fcnListen(er) {
    if (er) {
      client.close();
    } else {
      console.log('Express server listening on port ' + app.get('port'));
    }
  });

  /**
   * Route for fetch user Instagram post and parse it before send to the client
   * @function sendUserPhotos
   * @param {Object} req Express request
   * @param {Object} res Express response
   * @return {undefined}
   */
  async function subscribe(req, res) {
    if (req.params.type == 'subscribe') {
      try {
        await userAccounts.updateOne({_id: new ObjectID(req.session.ref)}, {$set: {devices: {hello: 'hi'}}});
        var response = await userAccounts.findOne({_id: new ObjectID(req.session.ref)});
        console.log(response);
        res.status(200).send(response);
      } catch (error) {
        console.log(error);
        res.status(500).send('Error');
      }
    } else if (req.params.type == 'unsubscribe') {
      console.log('Unsubscribe Pending!!..');
    }
  }

  /**
   * Route that works as endPoint for the OAuth 2.0 callback, can create an user or just update the session.
   * @function getUserData
   * @param {Object} id _app_ user ID.
   * @return {Object} Promise that resolve with user posts or reject with some request error (like 429 (Too many request)).
   */
  function getUserData(id) {
    return new Promise(function fetchData(resolve, reject) {
      var body = '';
      https.get('https://api.instagram.com/v1/users/self/media/recent/?access_token=' + getUserToken(id), function fcnGet(resp) {
        resp.setEncoding('utf8');
        resp.on('data', function fcnData(d) {
          body += d;
        });
        resp.on('end', function fcnEnd() {
          var response = {
            content: JSON.parse(body),
            status: this.statusCode,
            statusMessage: this.statusMessage
          };
          if (this.statusCode >= 200 && this.statusCode <= 226) {
            resolve(response);
          } else if (this.statusCode >= 400 && this.statusCode <= 511) {
            reject(response);
          }
        });
      }).on('error', function fcnError(e) {
        reject(e);
      });
    });
  }

  /**
   * Route that works as endPoint for the OAuth 2.0 callback, can create an user or just update the session.
   * @function login
   * @param {Object} req Express request
   * @param {Object} res Express response
   * @return {undefined}
   */
  function login(req, res) {
    var userIdentifier = req.body.userIdentifier;
    var getUserId = (userIdentifier.match(/@/)) ? getUserAppIdByEmail : getUserAppIdByUsername;
    var userId = getUserId(userIdentifier);
    if (!userId) {
      // userId = new ObjectID();
      // userAccounts.insertOne(req.user.profile, {safe: true}).then(function fcnInserOneResponse(resp) {
      //   var respElm = resp.ops[0];
      //   respElm.aT = req.user.aT;
      //   userIndexBy._id[respElm._id] = respElm;
      //   userIndexBy.instaID[respElm.instaID] = respElm;
      //   updateSession(respElm, req, res);
      // }).catch(function fcnInsertOneError(er) {
      //   console.log('db write error', er);
      // });
      res.status(401).send({url: '/'});
    } else {
      updateSession(userIndexBy._id[userId], req, res);
    }
  }

  /**
   * Update user session (cookies) and redirect to /
   * @function updateSession
   * @param {Object} user User profile, needed for update the session
   * @param {*} req Express request
   * @param {*} res Express response
   * @return {undefined}
   */
  async function updateSession(user, req, res) {
    req.session.ref = (user._id).toHexString();
    req.session.username = user.username;
    req.session.profilePic = user.picture;
    res.status(200).send({url: '/'});
  }

  /**
   * Middleware for check if the incoming request has an active session
   * @function checkAuth
   * @param {Object} req Express request
   * @param {Object} res Response
   * @param {Object} next Next route
   * @return {boolean} true if exist false in otherwise
   */
  function checkAuth(req, res, next) {
    if (!existID(req.session.ref)) {
      req.session = null;
      res.redirect('/');
    } else {
      next();
    }
  }

  /**
   * Check if the request user ID exist in our database
   * @function existID
   * @param {string} id _app_ user ID
   * @return {boolean} true if exist false in otherwise
   */
  function existID(id) {
    return (userIndexBy._id[id] && userIndexBy._id[id] ? true : false);
  }

  /**
   * Get the user _app_ id with the instagram _id_.
   * @function getUserAppIdByUsername
   * @param {string} username _app_ username
   * @return {String | null} _app_ ID || null if not exist
   */
  function getUserAppIdByUsername(username) {
    return ((userIndexBy.username[username] && userIndexBy.username[username]._id) ? userIndexBy.username[username]._id.toHexString() : null);
  }
  /**
   * Get the user _app_ id with the instagram _id_.
   * @function getUserAppIdByEmail
   * @param {string} email _app_ username
   * @return {String | null} _app_ ID || null if not exist
   */
  function getUserAppIdByEmail(email) {
    return ((userIndexBy.email[email] && userIndexBy.email[email]._id) ? userIndexBy.email[email]._id.toHexString() : null);
  }

  /**
   * Get user instagram _accessToken_ with the user _app_ id.
   * @function getUserToken
   * @param {string} id _app_ username
   * @return {String | null} _accessToken_ || null if not exist
   */
  function getUserToken(id) {
    return ((userIndexBy._id[id] ? userIndexBy._id[id].aT : null));
  }

  /**
   * Create an in memory copy of user collection, you can indexed by.
   * _id -> string
   * instaID
   * @function builduserIndexBy
   * @returns {boolean} True when userIndexBy is fully loaded
   */
  function builduserIndexBy() {
    return new Promise(function fcnPromise(resolve, reject) {
      if (!userIndexBy) {
        userIndexBy = {
          _id: {},
          username: {},
          email: {}
        };
        userAccounts.find({}).toArray(function fcnBuiluserIndexByAccounts(err, res) {
          if (err) {
            reject(err);
          } else {
            res.forEach(function fcnRes(elm) {
              userIndexBy._id[elm._id] = elm;
              userIndexBy.username[elm.username] = elm;
              userIndexBy.email[elm.email] = elm;
            });
            console.log('User index ready: ', userIndexBy);
            resolve(true);
          }
        });
      } else {
        reject('User index already builded.');
      }
    });
  }
});
