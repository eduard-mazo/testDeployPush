async function creatingCollections(ObjectID, db) {
  return new Promise(async (resolve) => {
    // User data
    var userAccounts = db.collection('userAccounts');
    await userAccounts.insertMany([
      {
        _id: new ObjectID('5cac9dfe1cd420104c1f2df3'),
        username: 'tester69',
        email: 'tester69@techtransit.com',
        password: '123456',
        devices: {}
      }
    ]);

    // PushNotification data
    var pushNotification = db.collection('pushNotification');
    await pushNotification.insertMany([
      {
        _id: new ObjectID('5cac9dfe1cd420104c1f2d69'),
        endpoint: 'https://fcm.googleapis.com/fcm/send/cZmcG4pDsN8:APA91bFt27_e6rcNsdxAmObUb7nX_a-ez1VhhE4Ci3Rhc04WEtQtFj6CStA9nMkmQePNe4z5c10eCYOxCCczzrEqrMsjgMVxsaBuyVs_Agyps7Y508blDNsRjWf3IFuSbccy-_5bnsax',
        state: 'reciveC',
        UTS: (new Date()).getTime(),
        body: {
          title: 'Hello from Mars!',
          body: "You're not alone!"
        }
      }
    ]);
    resolve();
  });
}

module.exports = creatingCollections;
