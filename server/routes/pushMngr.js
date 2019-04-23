'use strict';
var webPush = require('web-push');

module.exports = function pushMngr(userIndex) {
  var self = {};

  var _getUserDeviceIdByEndpoint = userIndex.getUserDeviceIdByEndpoint;
  var _getDeviceById = userIndex.getDeviceById;
  var _createDeviceRecord = userIndex.createDeviceRecord;
  var _getAllDevicesIds = userIndex.getAllDevicesIds;
  var _getAllUserDevices = userIndex.getAllUserDevices;
  var _updateUserSubscription = userIndex.updateUserSubscription;
  var _disableUserDevice = userIndex.disableUserDevice;
  var _updateDevicesState = userIndex.updateDevicesState;

  self.clientPushConfirmation = clientPushConfirmation;
  /**
   * @function clientPushConfirmation
   * @param {Object} req Express request
   * @param {Object} res Express response
   * @return {undefined}
   */
  function clientPushConfirmation(req, res) {
    console.log(req.body);
    res.status(200).send({hello: 'Hi from Server!'});
  }

  self.subscribe = subscribe;
  /**
   * @function subscribe
   * @param {Object} req Express request
   * @param {Object} res Express response
   * @return {undefined}
   */
  async function subscribe(req, res) {
    var userId = req.session.ref;
    var deviceId;
    var deviceState;

    var requestDeviceId = _getUserDeviceIdByEndpoint(userId, req.body.subscription.endpoint);
    var endpointDevice = _getDeviceById(userId, requestDeviceId);
    var userDevice = _getDeviceById(userId, req.body.deviceId);

    deviceId = (req.body.deviceId || requestDeviceId);
    deviceState = ((userDevice && userDevice.state) || (endpointDevice && endpointDevice.state));

    if (req.params.type == 'subscribe') {
      if ((!userDevice && !endpointDevice)) {
        deviceId = 'd_' + userId + '_' + (new Date().getTime()).toString(36);
        _createDeviceRecord(userId, deviceId, req.body.subscription, req.body.deviceDescr);
        res.status(201).send({message: 'Register successfully', deviceId: deviceId, state: 'abeable'});
      } else if (((userDevice && (userDevice.endpoints[0] != req.body.subscription.endpoint) || (!userDevice && (endpointDevice.endpoints[0] != req.body.subscription.endpoint))))) {
        _updateUserSubscription(userId, deviceId, req.body.subscription);
        res.status(200).send({message: 'Register updated', deviceId: deviceId, state: deviceState});
      } else if ((userDevice && (userDevice.endpoints[0] == endpointDevice.endpoints[0])) || (!userDevice && (endpointDevice.endpoints[0] == req.body.subscription.endpoint))) {
        res.status(200).send({message: 'Subscription Exist!', deviceId: deviceId, state: deviceState});
      }
    } else if (req.params.type == 'unsubscribe') {
      console.log('Unsubscribe Pending!!..');
    }
  }

  self.devices = devices;
  /**
   * @function devices
   * @param {Object} req Express request
   * @param {Object} res Express response
   * @return {undefined}
   */
  function devices(req, res) {
    var type = req.params.type;
    var devicesList;
    if (type == 'list') {
      devicesList = _getAllUserDevices(req.session.ref);
      if (devicesList) {
        res.status(200).send({devices: devicesList});
      } else {
        res.status(404);
      }
    } else if (type == 'update') {
      var userDevice = _getDeviceById(req.session.ref, req.body.deviceId);
      var subscription = {endpoint: userDevice.endpoints[0], keys: userDevice.keys};
      var content = {
        title: 'Device registered',
        message: {
          body: 'This device is ready for VP push notifications.',
          badge: 'img/vpBlack.png',
          icon: 'img/vp.png',
          tag: req.body.deviceId
        }
      };
      dispatchPush('push', req.body.deviceId, subscription, content, 60, function complete(error, deviceId) {
        devicesList = _getAllUserDevices(req.session.ref);
        if (!error) {
          _updateDevicesState(req.session.ref, deviceId);
          res.status(200).send({message: 'Device updated!', devices: devicesList});
        } else {
          res.status(404).send({message: 'Choose another!', devices: devicesList});
        }
      });
    }
  }

  self.sendPushNotification = sendPushNotification;
  function sendPushNotification(req, res) {
    var userDevice;
    var subscription;
    res.status(200).send('Sending..');
    if (req.params.type == 'broadcast') {
      var allAppDevices = _getAllDevicesIds();
      allAppDevices.forEach(function sendPing(elm) {
        userDevice = _getDeviceById(elm.split('_')[1], elm);
        if (userDevice.state != 'disable') {
          subscription = {endpoint: userDevice.endpoints[0], keys: userDevice.keys};
          dispatchPush(((userDevice.state == 'active') ? 'push' : 'local'), elm, subscription, req.body.content, 60);
        }
      });
    } else if (req.params.type == 'single') {
      userDevice = _getDeviceById(req.session.ref, req.body.content.message.tag);
      if (userDevice && (userDevice.state != 'disable')) {
        subscription = {endpoint: userDevice.endpoints[0], keys: userDevice.keys};
        dispatchPush(((userDevice.state == 'active') ? 'push' : 'local'), req.body.content.message.tag, subscription, req.body.content, 60);
      } else {
        res.status(404);
      }
    }
  }
  /**
   * Dispatch push notification to some user endpoint
   * @function dispatchPush
   * @param {string} type how to show the notification, (push => push notification, local => UI notification)
   * @param {string} deviceId user deviceId
   * @param {object} subscription user subscription
   * @param {object} content notification payload
   * @param {number} [TTL] time in seconds by default 7 days.
   * @param {function} callback arguments (error, deviceId)
   * @return {undefined}
   */
  function dispatchPush(type, deviceId, subscription, content, TTL, callback) {
    var vapidPublicKey = 'BIg1bDl3q9tc3wUvx3z1XYjz8Kg6SlJiLN_zo2iyl6Wc0CHzMKo2JxtSDGdheYiFugvfjZ2P0ltQT9-M8oWgMZc';
    var vapidPrivateKey = '12_gKITp6niRmQ4d4hyRrxS5R5lvoVgMkZOQP1SHPEs';
    var options = {
      TTL: (TTL ? TTL : 0),
      vapidDetails: {
        subject: 'mailto:autobot@visiplanner.com',
        publicKey: vapidPublicKey,
        privateKey: vapidPrivateKey
      }
    };
    content.type = type;
    var payload = JSON.stringify(content);

    webPush.sendNotification(
      subscription,
      payload,
      options
    ).then(function success() {
      console.log('Push Application Server - Notification sent to: ' + deviceId);
      ((typeof callback == 'function') && callback(null, deviceId));
    }).catch(function error() {
      console.log('ERROR in sending Notification to: ' + deviceId);
      _disableUserDevice(deviceId);
      ((typeof callback == 'function') && callback(true, deviceId));
    });
  }

  return self;
};
