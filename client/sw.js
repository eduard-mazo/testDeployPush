/*
20180708: followed https://classroom.udacity.com/courses/ud899/
Only tricky part is responding to /, to be determined by cookie existance (landing.html vs app.html) and server redirect (redundent check)
features to implement
*/
var db;

self.addEventListener('install', function fcnSWInstall() {
  var request = indexedDB.open('visiplannerPush', 1);
  request.onerror = function onError(event) {
    console.log('Database error: ' + event.target.errorCode);
  };
  request.onsuccess = function onSuccess(event) {
    db = event.target.result;
    readIndexedDB(1);
  };
  request.onupgradeneeded = function  onUpgradeneeded(event) {
    // Save the IDBDatabase interface
    db = event.target.result;
    // Create an objectStore for this database
    var objectStore = db.createObjectStore('userVp', { keyPath: 'ref' });
    objectStore.createIndex('userDeviceId', 'userDeviceId', { unique: true });
  };
  console.log('Listener INSTALL');
});

// Remove old cache for newly activated SW and claim for first load
self.addEventListener('redundant', function fcnSWActivate() {
  console.log('Listener REDUNDAT');
});
self.addEventListener('activate', function fcnSWActivate() {
  console.log('Listener ACTIVATE');
});

self.addEventListener('message', function fcnMessage(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('notificationclose', function fcnCloseNotify(event) {
  // console.log(event.notification);
});

self.addEventListener('notificationclick', function fcnClickNotify(event) {
  event.waitUntil(clients.openWindow('https://www.visiplanner.com'));
  // event.notification.close();
});

self.addEventListener('push', function fcnPush(event) {
  var content = JSON.parse(event.data.text());
  if (content.ping) {
    readIndexedDB(content.message.tag, sendPushConformationToServer);
  } else {
    event.waitUntil(
      clients.matchAll()
        .then(function fcnMatch(client) {
          var message = content.message;
          if (client[0].focused) {
            return self.registration.showNotification(content.title, content.message);
          }
          message.body = 'Have a nice day!';
          console.log(message);
          // return self.registration.showNotification("Don't forget", message);
          return true;
        })
        .catch(function fcnErrorMatch(err) {
          console.log(err);
        })
    );
  }
});

function sendPushConformationToServer(pushId, state) {
  fetch('/sw/pushDelivery', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({deliveryTS: (new Date().getTime()), pushId: pushId, state: state})
  }).then(function response(resp) {
    return resp.json();
  }).then(function parseResponse(data) {
    console.log(data);
  });
}

function addToIndexedDB(record) {
  var request = db.transaction(['userVp'], 'readwrite')
    .objectStore('userVp')
    .add(record);

  request.onsuccess = function success(event) {
    console.log('The data has been written successfully');
  };

  request.onerror = function error(err) {
    console.log('The data has been written failed: ', err);
  };
}

function readIndexedDB(id, callback) {
  var transaction = db.transaction(['userVp']);
  var objectStore = transaction.objectStore('userVp');
  var request = objectStore.get(1);

  request.onerror = function error(err) {
    console.log('Transaction failed', err);
  };

  request.onsuccess = function success(event) {
    if (request.result) {
      ((typeof callback == 'function') && callback(request.result.deviceId, 'ok'));
      console.log(request.result.deviceId);
    } else {
      ((typeof callback == 'function') && callback(id, 'error'));
      console.log('No data record');
    }
  };
}

function updateIndexedDB(record) {
  var request = db.transaction(['userVp'], 'readwrite')
    .objectStore('userVp')
    .put(record);

  request.onsuccess = function success(event) {
    console.log('The data has been updated successfully');
  };

  request.onerror = function error(err) {
    console.log('The data has been updated failed ', err);
  };
}
