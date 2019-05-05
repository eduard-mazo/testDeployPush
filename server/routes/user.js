'use strict';

<<<<<<< HEAD
var utils = require('../lib/utils');

=======
>>>>>>> 72902c7687ec10288f9a7b69c247646d60870e95
module.exports = function user(userIndex) {
  var self = {};
  var _getUserByEmail = userIndex.getUserByEmail;
  var _getUserByUsername = userIndex.getUserByUsername;
<<<<<<< HEAD
  var _createUserRecord = userIndex.createUserRecord;
  var _getUserByRefId = userIndex.getUserByRefId;
  var _updateUserPassword = userIndex.updateUserPassword;
=======
>>>>>>> 72902c7687ec10288f9a7b69c247646d60870e95
  var _existID = userIndex.existID;

  self.login = login;
  /**
   * Route that works as endpoint for the OAuth 2.0 callback, can create an user or just update the session.
   * @function login
   * @param {Object} req Express request
   * @param {Object} res Express response
   * @return {undefined}
   */
  function login(req, res) {
    var userIdentifier = req.body.userIdentifier;
    var userData = ((userIdentifier.match(/@/)) ? _getUserByEmail(userIdentifier) : _getUserByUsername(userIdentifier));
<<<<<<< HEAD
    if (userData) {
      if ((userData.password === utils.genCryptoHashed(req.body.password))) {
        updateSession(userData, req, res);
      } else {
        res.status(401).send({url: '/'});
      }
    } else {
      _createUserRecord(req.body, function complete(newUser) {
        updateSession(newUser, req, res);
      });
    }
  }

  self.changePassword = changePassword;
  /**
   * Change the user _app_ password and update the refId token
   * @function changePassword
   * @param {Object} req Express request
   * @param {Object} res Express response
   * @return {undefined}
   */
  function changePassword(req, res) {
    var oldPassword = utils.genCryptoHashed(req.body.oldPassword);
    var newPassword = utils.genCryptoHashed(req.body.newPassword);
    var userData = _getUserByRefId(req.session.ref);

    if (userData.password == oldPassword) {
      _updateUserPassword(userData._id.toHexString(), newPassword, function complete(err, userUpdated) {
        if (!err) {
          updateSession(userUpdated, req, res);
        }
      });
    } else {
      res.status(401).send({message: 'bad credentials try later!'});
=======
    if (userData && (userData.password == req.body.password)) {
      updateSession(userData, req, res);
    } else {
      res.status(401).send({url: '/'});
>>>>>>> 72902c7687ec10288f9a7b69c247646d60870e95
    }
  }

  /**
   * Update user session (cookies) and redirect to /
   * @function updateSession
   * @param {Object} userData User profile, needed for update the session
   * @param {*} req Express request
   * @param {*} res Express response
   * @return {undefined}
   */
  async function updateSession(userData, req, res) {
    req.session.ref = utils.obfuscate('1', 'u_' + (userData._id).toHexString() + '_' + userData.refLastUpdated.toString(36));
    req.session.username = userData.username;
    res.status(200).send({url: '/'});
  }
  self.checkAuth = checkAuth;
  /**
   * Middleware for check if the incoming request has an active session
   * @function checkAuth
   * @param {Object} req Express request
   * @param {Object} res Response
   * @param {Object} next Next route
   * @return {boolean} true if exist false in otherwise
   */
  function checkAuth(req, res, next) {
    if (!_existID(req.session.ref)) {
      req.session = null;
      res.redirect('/');
    } else {
      next();
    }
  }

<<<<<<< HEAD
  // self.expireUserSessions = function fcnExpireUserSessions(req, res) {
  //   var user = _userIndexBy.refId[req.session.ref];
  //   var oldRefId = Utils.obfuscate('1', 'u_' + user._id + '_' + user.refLastUpdated.toString(36));
  //   var refTS = (new Date()).getTime();
  //   var newRefId = Utils.obfuscate('1', 'u_' + user._id + '_' + refTS.toString(36));
  //   accounts.updateOne({_id: user._id}, {$set: {refLastUpdated: refTS}})
  //     .then(function success() {
  //       delete _userIndexBy.refId[oldRefId];
  //       user.refLastUpdated = refTS;
  //       _userIndexBy.refId[newRefId] = user;
  //       req.session.ref = newRefId;
  //       res.status(200).send('Your password has been updated');
  //     })
  //     .catch(function error(err) {
  //       logger.log('error', 'user.js database error:', err, 'ID: ' + oldRefId);
  //       res.status(401).send('There was a problem with updating your password, please check your orginal password.');
  //     });
  // };

=======
>>>>>>> 72902c7687ec10288f9a7b69c247646d60870e95
  return self;
};
