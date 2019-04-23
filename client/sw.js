/*
20180708: followed https://classroom.udacity.com/courses/ud899/
Only tricky part is responding to /, to be determined by cookie existance (landing.html vs app.html) and server redirect (redundent check)
features to implement
*/
var db;

self.addEventListener('install', function fcnSWInstall(event) {
  console.log('Listener INSTALL');
  event.waitUntil(
    initIndexDB()
      .then(function success(resp) {
        db = resp;
        return true;
      })
      .catch(function fail(err) {
        console.log(err);
        return false;
      })
  );
});

self.addEventListener('redundant', function fcnSWActivate() {
  console.log('Listener REDUNDAT');
});
self.addEventListener('activate', function fcnSWActivate() {
  console.log('Listener ACTIVATE');
  self.clients.claim();
});

self.addEventListener('message', function fcnMessage(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// self.addEventListener('notificationclose', function fcnCloseNotify(event) {
//    console.log(event.notification);
// });

self.addEventListener('notificationclick', function fcnClickNotify(event) {
  event.waitUntil(clients.openWindow('https://www.visiplanner.com'));
  // event.notification.close();
});

self.addEventListener('push', function fcnPush(event) {
  var content = JSON.parse(event.data.text());
  event.waitUntil(
    readIndexedDB(1, function getDevice(result) {
      if (result.deviceId.split('_')[1] == content.message.tag.split('_')[1]) {
        clients.matchAll()
          .then(function fcnMatch() {
            if (content.type == 'push') {
              return self.registration.showNotification(content.title, content.message);
            }
            console.log('This is a local Notification');
            return false;
          })
          .catch(function fcnErrorMatch(err) {
            console.log(err);
          });
      }
      return false;
    })
  );
});

// function sendPushConformationToServer(pushId, state) {
//   fetch('/sw/pushDelivery', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({deliveryTS: (new Date().getTime()), pushId: pushId, state: state})
//   }).then(function response(resp) {
//     return resp.json();
//   }).then(function parseResponse(data) {
//     console.log(data);
//   });
// }

function initIndexDB() {
  return new Promise(function initDB(resolve, reject) {
    var request = indexedDB.open('visiplannerPush', 1);
    request.onsuccess = function success(event) {
      resolve(event.target.result);
    };
    request.onerror = function fail(err) {
      reject(err);
    };
  });
}
function readIndexedDB(id, callback) {
  if (db) {
    var transaction = db.transaction(['userVp']);
    var objectStore = transaction.objectStore('userVp');
    var request = objectStore.get(1);

    request.onerror = function error(err) {
      console.log('Transaction failed', err);
    };
    request.onsuccess = function success() {
      ((typeof callback == 'function') && callback(request.result));
    };
  } else {
    console.log('init DB');
    initIndexDB()
      .then(function success(resp) {
        db = resp;
        readIndexedDB(id, callback);
      })
      .catch(function fail(err) {
        console.log(err);
      });
  }
}

