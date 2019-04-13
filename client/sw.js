/*
20180708: followed https://classroom.udacity.com/courses/ud899/
Only tricky part is responding to /, to be determined by cookie existance (landing.html vs app.html) and server redirect (redundent check)
features to implement
*/

self.addEventListener('install', function fcnSWInstall() {
  console.log('Listener INSTALL');
});

// Remove old cache for newly activated SW and claim for first load
self.addEventListener('activate', function fcnSWActivate() {
  console.log('Listener ACTIVATE');
});

self.addEventListener('message', function fcnMessage(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('notificationclose', function fcnCloseNotify(event) {
  var notification = event.notification;
  var primaryKey = notification.tag;
  console.log('Closed notification: ' + primaryKey);
});

self.addEventListener('notificationclick', function fcnClickNotify(event) {
  var notification = event.notification;
  var action = event.action;

  if (action === 'close') {
    notification.close();
  } else {
    notification.close();
  }
});

self.addEventListener('push', function fcnPush(event) {
  console.log(event.data.text());
  var options;
  if (event.data) {
    options = JSON.parse(event.data.text());
  } else {
    options = {body: 'Default body'};
  }

  event.waitUntil(
    clients.matchAll()
      .then(function fcnMatch() {
        self.registration.showNotification('Push Notification', options);
      })
      .catch(function fcnErrorMatch(err) {
        console.log(err);
      })
  );
});
