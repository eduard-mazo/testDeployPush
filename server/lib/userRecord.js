'use strict';
<<<<<<< HEAD
var utils = require('../lib/utils');
=======

>>>>>>> 72902c7687ec10288f9a7b69c247646d60870e95
module.exports = function userIndex(db, ObjectID) {
  var self = {};
  var userAccounts = db.collection('userAccounts');
  var userIndexBy;

  self.buildUserIndex = buildUserIndex;
  /**
   * Create an in memory copy of user collection, you can indexed by.
   * _id -> string
   * instaID
   * @function buildUserIndex
   * @returns {boolean} True when userIndexBy is fully loaded
   */
  function buildUserIndex() {
    return new Promise(function fcnPromise(resolve, reject) {
      if (!userIndexBy) {
        userIndexBy = {
          _id: {},
          username: {},
<<<<<<< HEAD
          email: {},
          refId: {}
=======
          email: {}
>>>>>>> 72902c7687ec10288f9a7b69c247646d60870e95
        };
        userAccounts.find({}).toArray(function fcnBuiluserIndexByAccounts(err, res) {
          if (err) {
            reject(err);
          } else {
            res.forEach(function fcnRes(elm) {
<<<<<<< HEAD
              userIndexBy._id[elm._id] = elm;
              userIndexBy.username[elm.username] = elm;
              userIndexBy.email[elm.email] = elm;
              userIndexBy.refId[utils.obfuscate('1', 'u_' + elm._id + '_' + elm.refLastUpdated.toString(36))] = elm;
=======
              userIndexBy._id[new ObjectID(elm._id)] = elm;
              userIndexBy.username[elm.username] = elm;
              userIndexBy.email[elm.email] = elm;
>>>>>>> 72902c7687ec10288f9a7b69c247646d60870e95
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

  self.existID = existID;
  /**
<<<<<<< HEAD
   * Check if the request user in the cookie exist in our database
   * @function existID
   * @param {string} refId _app_ user referenceId
   * @return {boolean} true if exist false in otherwise
   */
  function existID(refId) {
    return (userIndexBy.refId[refId] && userIndexBy.refId[refId] ? true : false);
=======
   * Check if the request user ID exist in our database
   * @function existID
   * @param {string} id _app_ user ID
   * @return {boolean} true if exist false in otherwise
   */
  function existID(id) {
    return (userIndexBy._id[id] && userIndexBy._id[id] ? true : false);
>>>>>>> 72902c7687ec10288f9a7b69c247646d60870e95
  }

  self.getUserByUsername = getUserByUsername;
  /**
   * Get the user _app_ data using the _username_
   * @function getUserByUsername
   * @param {string} username _app_ username
   * @return {String | null} _app_ userProfile || null if not exist
   */
  function getUserByUsername(username) {
    return (((typeof username == 'string') && userIndexBy.username[username]) ? userIndexBy.username[username] : null);
  }

  self.getUserByEmail = getUserByEmail;
  /**
   * Get the user _app_ data using the _email_
   * @function getUserByEmail
   * @param {string} email _app_ email
   * @return {String | null} _app_ userProfile || null if not exist
   */
  function getUserByEmail(email) {
    return (((typeof email == 'string') && userIndexBy.email[email]) ? userIndexBy.email[email] : null);
  }

<<<<<<< HEAD
  self.getUserByRefId = getUserByRefId;
  /**
   * Get the user _app_ data using the _email_
   * @function getUserByRefId
   * @param {string} refId _app_ user refId
   * @return {String | null} _app_ userProfile || null if not exist
   */
  function getUserByRefId(refId) {
    return (((typeof refId == 'string') && userIndexBy.refId[refId]) ? userIndexBy.refId[refId] : null);
  }

  self.getUserDeviceIdByEndpoint = getUserDeviceIdByEndpoint;
  /**
   * @function getUserDeviceIdByEndpoint
   * @param {String} id _app_ user Id
=======
  self.getUserDeviceIdByEndpoint = getUserDeviceIdByEndpoint;
  /**
   * @function getUserDeviceIdByEndpoint
   * @param {String} id _app_ user ID.
>>>>>>> 72902c7687ec10288f9a7b69c247646d60870e95
   * @param {String} endpoint _app_ subscription endpoint
   * @return {Object} user device id
   */
  function getUserDeviceIdByEndpoint(id, endpoint) {
    if ((typeof id == 'string') && (typeof endpoint == 'string')) {
      var user = userIndexBy._id[id];
      for (var deviceId in user.devices) {
        if (user.devices[deviceId].endpoints.includes(endpoint)) {
          return deviceId;
        }
      }
    }
    return null;
  }

  self.createDeviceRecord = createDeviceRecord;
  /**
   * @function createDeviceRecord
   * @param {String} id _app_ user ID.
   * @param {String} deviceId Unique device user ID.
   * @param {String} subscription User browser subscription
   * @param {String} deviceDescr User device description
   * @return {undefined}
   */
  function createDeviceRecord(id, deviceId, subscription, deviceDescr) {
    var device = {[deviceId]: {endpoints: [subscription.endpoint], state: 'abeable', LUT: (new Date()).getTime(), keys: subscription.keys, descr: deviceDescr}};
    userAccounts.updateOne({_id: new ObjectID(id)}, {$set: {devices: device}});
    userIndexBy._id[id].devices[deviceId] = device[deviceId];
  }

<<<<<<< HEAD
  self.createUserRecord = createUserRecord;
  /**
   * @function createUserRecord
   * @param {String} body incoming new _app_ user data
   * @param {String} callback pass the new as argument to the callback
   * @return {undefined}
   */
  function createUserRecord(body, callback) {
    var id = new ObjectID();
    var newUser = {
      _id: id,
      username: body.userIdentifier,
      refLastUpdated: (new Date()).getTime(),
      email: (body.email ? body.email : ((new Date()).getTime()).toString(36) + '@temp.com'),
      password: utils.genCryptoHashed(body.password),
      devices: {}
    };

    userIndexBy._id[id] = newUser;
    userIndexBy.username[newUser.username] = newUser;
    userIndexBy.email[newUser.email] = newUser;
    userIndexBy.refId[utils.obfuscate('1', 'u_' + id + '_' + newUser.refLastUpdated.toString(36))] = newUser;
    userAccounts.insertOne(newUser);
    ((typeof callback == 'function') && callback(newUser));
  }

  self.getAllUserDevices = getAllUserDevices;
  /**
   * @function getAllUserDevices
   * @param {String} id _app_ user Id.
=======
  self.getAllUserDevices = getAllUserDevices;
  /**
   * @function getAllUserDevices
   * @param {String} id _app_ user ID.
>>>>>>> 72902c7687ec10288f9a7b69c247646d60870e95
   * @return {Object} user devices
   */
  function getAllUserDevices(id) {
    return (((typeof id == 'string') && userIndexBy._id[id] && userIndexBy._id[id].devices) ? userIndexBy._id[id].devices : null);
  }

  self.updateDevicesState = updateDevicesState;
  /**
   * @function updateDevicesState
   * @param {String} id _app_ user Id
   * @param {String} deviceId _app_ user device Id to update
   * @param {String} deviceType User device type (mobile or desktop)
   * @return {undefined}
   */
  function updateDevicesState(id, deviceId) {
    var matchType;
    if ((typeof id == 'string') && userIndexBy._id[id]) {
      for (var device in userIndexBy._id[id].devices) {
        if (userIndexBy._id[id].devices[device].state != 'disable') {
          if (device == deviceId) {
            userIndexBy._id[id].devices[device].state = 'active';
          } else if (matchType) {
            userIndexBy._id[id].devices[device].state = 'abeable';
          }
        }
      }
    }
  }

  self.getAllDevicesIds = getAllDevicesIds;
  /**
   * @function getAllDevicesIds
   * @return {Object} user devices id
   */
  function getAllDevicesIds() {
    var allAppDevices = [];
    for (var user in userIndexBy._id) {
      for (var device in userIndexBy._id[user].devices) {
        allAppDevices.push(device);
      }
    }
    return allAppDevices;
  }

  self.getDeviceById = getDeviceById;
  /**
   * @function getDeviceById
<<<<<<< HEAD
   * @param {String} id _app_ user Id
=======
   * @param {String} id _app_ user id.
>>>>>>> 72902c7687ec10288f9a7b69c247646d60870e95
   * @param {String} deviceId _app_ user deviceId.
   * @return {Object} user device
   */
  function getDeviceById(id, deviceId) {
    return ((userIndexBy._id[id] && userIndexBy._id[id].devices && userIndexBy._id[id].devices[deviceId]) ? userIndexBy._id[id].devices[deviceId] : null);
  }

  self.disableUserDevice = disableUserDevice;
  /**
   * disable all the bad endpoints.
   * @function disableUserDevice
   * @param {String} deviceId _app_ user device is
   * @return {undefined}
   */
  function disableUserDevice(deviceId) {
    var userId = deviceId.split('_')[1];
    var dataToUpdate = Object.assign(userIndexBy._id[userId].devices[deviceId], {state: 'disable', LUT: (new Date()).getTime()});
    userAccounts.updateOne({_id: new ObjectID(userId)}, {$set: {devices: {[deviceId]: dataToUpdate}}});
    console.log('User device: ' + deviceId + ' was disable');
  }

  self.updateUserSubscription = updateUserSubscription;
  /**
   * @function updateUserSubscription
   * @param {String} id _app_ user ID.
   * @param {String} userDeviceId _app_ old subscription endpoint
   * @param {Object} newSubscription _app_ new user subscription
   * @return {undefined}
   */
  function updateUserSubscription(id, userDeviceId, newSubscription) {
    var oldDeviceData = userIndexBy._id[id].devices[userDeviceId]; // In case that the DB updateOne fail.
    userIndexBy._id[id].devices[userDeviceId].endpoints.unshift(newSubscription.endpoint);
    var dataToUpdate = Object.assign(userIndexBy._id[id].devices[userDeviceId],
      {
        endpoints: userIndexBy._id[id].devices[userDeviceId].endpoints,
        LUT: (new Date()).getTime(),
        keys: newSubscription.keys
      });

<<<<<<< HEAD
    userAccounts.updateOne({id: new ObjectID(id)}, {$set: {devices: {[userDeviceId]: dataToUpdate}}})
=======
    userAccounts.updateOne({_id: new ObjectID(id)}, {$set: {devices: {[userDeviceId]: dataToUpdate}}})
>>>>>>> 72902c7687ec10288f9a7b69c247646d60870e95
      .catch(function recoverOldData() {
        userIndexBy._id[id].devices[userDeviceId] = oldDeviceData;
        console.log('Error while writing in DB new enpoint for: ', userDeviceId);
      });
  }
<<<<<<< HEAD

  self.updateUserPassword = updateUserPassword;
  /**
   * @function updateUserPassword
   * @param {string} id user _app_ id.
   * @param {String} newPassword new user _app_ password
   * @param {String} callback on success or error callback(err).
   * @return {undefined}
   */
  function updateUserPassword(id, newPassword, callback) {
    var userData = userIndexBy._id[id];
    delete userIndexBy.refId[utils.obfuscate('1', 'u_' + id + '_' + userData.refLastUpdated.toString(36))];
    var dataToUpdate = Object.assign(userData, {refLastUpdated: (new Date()).getTime(), password: newPassword});
    userIndexBy.refId[utils.obfuscate('1', 'u_' + id + '_' + dataToUpdate.refLastUpdated.toString(36))] = dataToUpdate;
    userAccounts.updateOne({id: new ObjectID(id)}, {$set: {password: dataToUpdate.password, refLastUpdated: dataToUpdate.refLastUpdated}})
      .then(function success() {
        ((typeof callback == 'function' && callback(false, dataToUpdate)));
      })
      .catch(function recoverOldData() {
        console.log('Error while writing in DB new enpoint for: ', id);
        ((typeof callback == 'function' && callback(true)));
      });
  }
=======
>>>>>>> 72902c7687ec10288f9a7b69c247646d60870e95
  return self;
};
