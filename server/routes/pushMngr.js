'use strict';
var webPush = require('web-push');

module.exports = function pushMngr(userIndex) {
  var pushNotifyRecord = {};
  var self = {};

  var _getUserDeviceIdByEndpoint = userIndex.getUserDeviceIdByEndpoint;
  var _getDeviceById = userIndex.getDeviceById;
  var _createDeviceRecord = userIndex.createDeviceRecord;
  var _getAllDevicesIds = userIndex.getAllDevicesIds;
  var _getAllUserDevices = userIndex.getAllUserDevices;
  var _updateUserSubscription = userIndex.updateUserSubscription;
  var _updateUserDeviceState = userIndex.updateUserDeviceState;
  var _updateDevicesType = userIndex.updateDevicesType;

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

    var requestDeviceId = _getUserDeviceIdByEndpoint(userId, req.body.subscription.endpoint);
    var endpointDevice = _getDeviceById(userId, requestDeviceId);
    var userDevice = _getDeviceById(userId, req.body.deviceId);
    if (req.params.type == 'subscribe') {
      if ((!userDevice && !endpointDevice)) {
        var deviceId = 'd_' + userId + '_' + (new Date().getTime()).toString(36);
        _createDeviceRecord(userId, deviceId, req.body.subscription, req.body.deviceDescr);
        res.status(201).send({message: 'Register successfully', deviceId: deviceId});
      } else if (((userDevice && (userDevice.endpoints[0] != req.body.subscription.endpoint) || (!userDevice && (endpointDevice.endpoints[0] != req.body.subscription.endpoint))))) {
        _updateUserSubscription(userId, (req.body.deviceId || requestDeviceId), req.body.subscription);
        res.status(200).send({message: 'Register updated', devices: _getAllUserDevices(userId)});
      } else if ((userDevice && (userDevice.endpoints[0] == endpointDevice.endpoints[0])) || (!userDevice && (endpointDevice.endpoints[0] == req.body.subscription.endpoint))) {
        res.status(200).send({message: 'Subscription Exist!'});
      }
    } else if (req.params.type == 'unsubscribe') {
      console.log('Unsubscribe Pending!!..');
    } else if (req.params.type == 'list') {
      console.log('List Pending!!..');
      res.status(200).send(_getAllUserDevices(userId));
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
    if (type == 'list') {
      var devicesList = _getAllUserDevices(req.session.ref);
      if (devicesList) {
        res.status(200).send({devices: devicesList});
      } else {
        res.status(404);
      }
    } else if (type == 'update') {
      _updateDevicesType(req.session.ref, req.body.deviceId, req.body.deviceType);
      res.status(200).send({message: 'Device updated!'});
    }
  }

  self.sendPushNotification = sendPushNotification;
  function sendPushNotification(req, res) {
    var userDevice = _getDeviceById(req.session.ref, req.body.content.message.tag);
    if (userDevice) {
      res.status(200).send('Sending..');
      var subscription = {endpoint: userDevice.endpoints[0], keys: userDevice.keys};
      dispatchPush(userDevice.type, subscription, 60, req.body.content);
    } else {
      res.status(404);
    }
    // for (var deviceId in userDevices) {
    //   if (userDevices[deviceId].state == 'active') {
    //     dispatchPush({endpoint: userDevices[deviceId].endpoints[0], keys: userDevices[deviceId].keys}, deviceId, req.body.content);
    //   }
    // }
  }

  function dispatchPush(type, subscription, TTL, content) {
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
      console.log('Push Application Server - Notification sent to: ' + content.message.tag);
    }).catch(function error() {
      console.log('ERROR in sending Notification to: ' + content.message.tag);
      _updateUserDeviceState(content.message.tag, 'disable');
    });
  }

  // setInterval(function checkUserEndpoints() {
  //   console.log('checking users!');
  //   var allAppDevices = _getAllDevicesIds();
  //   allAppDevices.forEach(function sendPing(elm, index) {
  //     var userDevice = _getDeviceById(elm.split('_')[1], elm);
  //     dispatchPush({endpoint: userDevice.endpoints[0], keys: userDevice.keys}, elm, {ping: 'ping'});
  //   });
  // }, 10000);

  return self;
};
