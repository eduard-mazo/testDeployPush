'use strict';
var crypto	= require('crypto');
// some functions cherrypicked from express/node_modules/connect/lib/utils.js
/**
 * Return hash of the given string and optional crypto type & encoding,
 * defaulting to sha1 and hex respectively.
 * utils.genCryptoHashed('wahoo', 'md5');
 * => "e493298061761236c96b02ea6aa8a2ad"
 * @param {String} str
 * @param {String} hashType
 * @param {String} encoding
 * @return {String}
 * @api private
 */

exports.genCryptoHashed = function fcnGenCryptoHashed(str, hashType, encoding) {
  return crypto
    .createHash(hashType || 'sha1') // or md5
    .update(str)
    .digest(encoding || 'hex'); // or ascii
};


// Part of https://github.com/chris-rock/node-crypto-examples
// Nodejs encryption with CTR

// var crypto = require('crypto'),
var algorithm = 'aes-256-ctr';
var password = '6a9ca9092d3c59b485d1c90730ee5c45'; // 32 bytes string
var iv = '728bc6d13f540a5b'; // 16 bytes string

exports.encrypt = function fcnEncryp(text) {
  var cipher = crypto.createCipheriv(algorithm, password, iv);
  var crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
};

exports.decrypt = function fcnDecrypt(text) {
  var decipher = crypto.createDecipheriv(algorithm, password, iv);
  var dec = decipher.update(text, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
};

exports.obfuscate = function fcnObfuscate(version, text) {
  if (version === '1') {
    var size = text.length;
    var charArray = new Array(size);
    for (var i = 0; i < size; i++) {
      charArray[i] = String.fromCharCode(text.charCodeAt(i) + 4);
    }
    charArray.reverse();
    return  version + charArray.join('');
  }
  return false;
};

exports.deObfuscate = function fcnDeObfuscate(text) {
  var version = text.charAt(0);
  text = text.substring(1);
  if (version === '1') {
    var size = text.length;
    var charArray = new Array(size);
    for (var i = 0; i < size; i++) {
      charArray[i] = String.fromCharCode(text.charCodeAt(i) - 4);
    }
    charArray.reverse();
    return  charArray.join('');
  }
  return false;
};
/*  not needed after moved away from couchdb, using stock bson id with mongo
exports.genUserID = function (version, text){
  if (version == '1') {
    text = text.replace('@', '(').split('').reverse().join('');
    return  (milsecSince2014()).toString(16) + ")" + version + text;
  }
};

exports.getEmailFromID = function (text){
  text = text.split(')')[1];
  var version = text.charAt(0);
  text = text.substring(1);
  if (version == '1') {
    return text.replace('(', '@').split('').reverse().join('');
  }
}

function milsecSince2014() {
   return (new Date() - new Date(2014,0,1));
}

exports.dbNamefromID = function(userID) {
  var version = userID.split(')')[1].charAt(0);
  if (version == 1) {
    return (userID.split(')').reverse().join(')')).substring(1).replace(/\W/g, ''); //strip all alphanumeric numbers
  }
}
*/
/**
 * Merge object b with object a.
 *     var a = { foo: 'bar' }
 *       , b = { bar: 'baz' };
 *     utils.merge(a, b);
 *     // => { foo: 'bar', bar: 'baz' }
 * @function merge
 * @param {Object} a Obj1
 * @param {Object} b Obj2
 * @return {Object} Object Merged
 * @api private
 */
exports.merge = function fcnMerge(a, b) {
  if (a && b) {
    for (var key in b) {
      a[key] = b[key];
    }
  }
  return a;
};
// https://github.com/isaacs/util-extend
exports.extend = function fcnExtend(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || typeof add !== 'object') return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};


// from:
// http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
exports.clone = clone;
function clone(obj) {
  var copy;

  // Handle the 3 simple types, and null or undefined
  if (obj === null || typeof obj !== 'object') return obj;

  // Handle Date
  if (obj instanceof Date) {
    copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  // Handle Array
  if (obj instanceof Array) {
    copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = clone(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if (obj instanceof Object) {
    copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
    }
    return copy;
  }

  throw new Error("Unable to copy obj! Its type isn't supported.");
}


/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function fcnEscape(html) {
  return String(html)
    .replace(/&(?!\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};
/**
 * Return a unique identifier with the given `len`.
 *
 *     utils.uid(10);
 *     // => "FDaS435D2z"
 *
 * @param {Number} len
 * @return {String}
 * @api private
 */

exports.uid = function fcnUid(len) {
  return crypto.randomBytes(Math.ceil(len * 3 / 4))
    .toString('base64')
    .slice(0, len);
};

exports.compareObjects = function deepComp(obj1, obj2) {
  // Loop through properties in object 1
  for (var p in obj1) {
    // Check property exists on both objects
    if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false;

    switch (typeof (obj1[p])) {
      // Deep compare objects
      case 'object':
        if (!deepComp(obj1[p], obj2[p])) return false;
        break;
      // Compare function code
      case 'function':
        if (typeof (obj2[p]) === 'undefined' || (p !== 'compare' && obj1[p].toString() !== obj2[p].toString())) return false;
        break;
      // Compare values
      default:
        if (obj1[p] !== obj2[p]) return false;
    }
  }

  // Check object 2 for any extra properties
  for (p in obj2) {
    if (typeof (obj1[p]) === 'undefined') return false;
  }
  return true;
};

