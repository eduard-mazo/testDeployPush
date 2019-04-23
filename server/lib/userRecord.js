'use strict';

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

  self.existID = existID;
  /**
   * Check if the request user ID exist in our database
   * @function existID
   * @param {string} id _app_ user ID
   * @return {boolean} true if exist false in otherwise
   */
  function existID(id) {
    return (userIndexBy._id[id] && userIndexBy._id[id] ? true : false);
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

  self.getUserDeviceIdByEndpoint = getUserDeviceIdByEndpoint;
  /**
   * @function getUserDeviceIdByEndpoint
   * @param {String} id _app_ user ID.
   * @param {String} endpoint _app_ subscription endpoint
   * @return {Object} user device id
   */
  function getUserDeviceIdByEndpoint(id, endpoint) {
    if ((typeof id == 'string') && (typeof id == 'string')) {
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

  self.getAllUserDevices = getAllUserDevices;
  /**
   * @function getAllUserDevices
   * @param {String} id _app_ user ID.
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
   * @param {String} id _app_ user id.
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

    userAccounts.updateOne({_id: new ObjectID(id)}, {$set: {devices: {[userDeviceId]: dataToUpdate}}})
      .catch(function recoverOldData() {
        userIndexBy._id[id].devices[userDeviceId] = oldDeviceData;
        console.log('Error while writing in DB new enpoint for: ', userDeviceId);
      });
  }
  return self;
};
