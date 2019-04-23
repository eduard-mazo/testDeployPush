'use strict';

module.exports = function user(userIndex) {
  var self = {};
  var _getUserByEmail = userIndex.getUserByEmail;
  var _getUserByUsername = userIndex.getUserByUsername;
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
    if (!userData) {
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
      updateSession(userData, req, res);
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
    req.session.ref = (userData._id).toHexString();
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

  return self;
};
