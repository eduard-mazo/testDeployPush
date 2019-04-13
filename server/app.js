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
    var userId = req.session.ref;
    var userSubscription = getUserSubscriptionDevice(userId, req.body.subscription.endpoint);

    if (req.params.type == 'subscribe') {
      if ((!req.session.endpoint && !userSubscription)) {
        var deviceId = req.body.deviceId + '_' + (new Date().getTime()).toString(36);
        var device = {[deviceId]: {endPoints: [req.body.subscription.endpoint], state: 'active', LUT: (new Date()).getTime()}};
        try {
          await userAccounts.updateOne({_id: new ObjectID(userId)}, {$set: {devices: device}});
          userIndexBy._id[userId].devices[deviceId] = device[deviceId];
          req.session.endpoint = req.body.subscription.endpoint;
          res.status(201).send({message: 'Register successfully'});
        } catch (error) {
          console.log(error);
          res.status(500).send('Error');
        }
      } else if ((!req.session.endpoint && userSubscription)) {
        req.session.endpoint = userSubscription.endPoints[0];
        res.status(200).send({message: 'Subscription Exist! and cookie updated!'});
      } else if ((req.session.endpoint && (req.session.endpoint != req.body.subscription.endpoint))) {
        updateUserSubscription(userId, req.session.endpoint, req.body.subscription.endpoint);
        req.session.endpoint = req.body.subscription.endpoint;
        res.status(200).send({message: 'Register updated'});
      } else if (req.session.endpoint == userSubscription.endPoints[0]) {
        res.status(200).send({message: 'Subscription Exist!'});
      }
    } else if (req.params.type == 'unsubscribe') {
      console.log('Unsubscribe Pending!!..');
    }
  }

  /**
   * @function getUserSubscriptionDevice
   * @param {Object} id _app_ user ID.
   * @param {Object} endpoint _app_ subscription endpoint
   * @return {Object} user device id
   */
  function getUserSubscriptionDevice(id, endpoint) {
    var user = userIndexBy._id[id];
    for (var device in user.devices) {
      console.log('User device: ', device, ' has the requesting endpoint: ', user.devices[device].endPoints.includes(endpoint));
      if (user.devices[device].endPoints.includes(endpoint)) {
        return {device: device, endPoints: user.devices[device].endPoints};
      }
    }
    return null;
  }

  /**
   * @function updateUserSubscription
   * @param {Object} id _app_ user ID.
   * @param {Object} oldEndpoint _app_ old subscription endpoint
   * @param {Object} newEndpoint _app_ new subscription endpoint
   * @return {Object} user device id
   */
  function updateUserSubscription(id, oldEndpoint, newEndpoint) {
    var userDevice = getUserSubscriptionDevice(id, oldEndpoint);
    userIndexBy._id[id].devices[userDevice.device].endPoints.unshift(newEndpoint);
  }

  // /**
  //  * @function existSubscription
  //  * @param {Object} id _app_ user ID.
  //  * @param {Object} endpoint _app_ subscription endpoint
  //  * @return {Object} Promise that resolve with user posts or reject with some request error (like 429 (Too many request)).
  //  */
  // function existSubscription(id, endpoint) {
  //   var user = userIndexBy._id[id];
  //   for (var device in user.devices) {
  //     console.log('User device: ', device, ' has the requesting endpoint: ', user.devices[device].endPoints.includes(endpoint));
  //     if (user.devices[device].endPoints.includes(endpoint)) {
  //       return true;
  //     }
  //   }
  // }

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
              userIndexBy._id[new ObjectID(elm._id)] = elm;
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
