'use strict';

//
// Example: node seed.js MONGO_USER MONGO_PASSWORD mongodb nrts-prod
//

var Promise         = require('es6-promise').Promise;
var _               = require('lodash');
var request         = require('request');
var fs              = require('fs');
var _applications   = [];
var _commentPeriods = [];
var username        = '';
var password        = '';
var protocol        = 'http';
var host            = 'localhost';
var port            = '3000'
var uri             = '';

var args = process.argv.slice(2);
if (args.length !== 5) {
  console.log('');
  console.log('Please specify proper parameters: <username> <password> <protocol> <host> <port>');
  console.log('');
  console.log('eg: node seed.js admin admin http localhost 3000');
  return;
} else {
  username    = args[0];
  password    = args[1];
  protocol    = args[2];
  host        = args[3];
  port        = args[4];
  uri         = protocol + '://' + host + ':' + port + '/'; 
  console.log('Using connection:', uri);
}
// return;
// JWT Login
var jwt_login = null;
var login = function (username, password) {
  return new Promise (function (resolve, reject) {
    var body = JSON.stringify({
        username: username,
        password: password
      });
    request.post({
        url: uri + 'api/login/token',
        headers: {
          'Content-Type': 'application/json'
        },
        body: body
      }, function (err, res, body) {
        if (err || res.statusCode !== 200) {
          // console.log("err:", err, res);
          reject(null);
        } else {
          var data = JSON.parse(body);
          // console.log("jwt:", data);
          jwt_login = data.accessToken;
          resolve(data.accessToken);
        }
    });
  });
};

var insertAll = function (route, entries) {
  var self = this;
  return new Promise(function (resolve, reject) {
    console.log("route:", route);
    // console.log("entries:", entries);

    _.each(entries, function (e) {
      // console.log("e:", e);
      var postBody = JSON.stringify(e);

      // Bind the objectID's
      if (route === 'api/document' || route === 'api/commentperiod') {
        var f = _.find(_applications, {code: e._application});
        e._application = f._id;
      }
      if (route === 'api/public/comment') {
        var f = _.find(_commentPeriods, {code: e.commentPeriod});
        e._commentPeriod = f._id;
      }
      postBody = JSON.stringify(e);
      // end bind objectID's

      request.post({
          url: uri + route,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + jwt_login
          },
          body: postBody
        }, function (err, res, body) {
          if (err || res.statusCode !== 200) {
            // console.log("err:", err, res);
            reject(null);
          } else {
            var data = JSON.parse(body);
            console.log("SAVED:", data._id);

            // Save the various objects for later lookup
            if (route === 'api/application') {
                _applications.push(data);
            }
            if (route === 'api/commentperiod') {
                _commentPeriods.push(data);
            }

            if (route === 'api/document') {
                var formData = {
                    upfile: fs.createReadStream(e.internalURL)
                };
                request.put({ url: uri + route + '/' + data._id,
                              headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': 'Bearer ' + jwt_login
                              },
                              formData: formData
                            },
                  function optionalCallback(err, httpResponse, body) {
                      if (err) {
                        console.error('upload failed:', err);
                        reject(null);
                      } else {
                        // Update it to be public
                        request.put({
                            url: uri + route + '/' + data._id + '/publish',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': 'Bearer ' + jwt_login
                            },
                            body: postBody
                        }, function (err2, res2, body2) {
                          if (err2 || res2.statusCode !== 200) {
                            console.log("err2:", err2);
                            reject(null);
                          } else {
                            resolve("Updated:", body2._id);
                          }
                        });
                      }
                  }
                );                
            } else {
                if (route === 'api/public/comment') {
                  // Swap to the authenticated access route.
                  route = 'api/comment';
                }
                // Update it to be public - assume everything public
                // unless it has the magic flag.
                if (e.seedDontPublish) {
                  resolve();
                } else {
                  request.put({
                    url: uri + route + '/' + data._id + '/publish',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': 'Bearer ' + jwt_login
                    },
                    body: postBody
                    }, function (err3, res2, body2) {
                      if (err3 || res2.statusCode !== 200) {
                      console.log("err3:", err3);
                      reject(null);
                    } else {
                      resolve("Updated:", body2._id);
                    }
                  });
                }
            }
          }
      });
    });
  });
};

var updateAll = function (collectionName, entries) {
  if (_.isEmpty(entries)) {
    return Promise.resolve();
  }
  var updates = _.map(entries, function (entry) {
    return update(collectionName, { _id: entry._id }, entry);
  });
  return Promise.all(updates);
};
console.log("Logging in and getting JWT:");
login(username, password)
.then(function () {
  var orglist = require('./orglist.json');
  return insertAll('api/organization', orglist);
})
.then(function () {
  var applist = require('./applist.json');
  return insertAll('api/application', applist);
})
.then(function () {
  var orglist = require('./doclist.json');
  return insertAll('api/document', orglist);
})
.then(function () {
  var cplist = require('./commentperiodlist.json');
  return insertAll('api/commentperiod', cplist);
})
.then(function () {
  var clist = require('./commentlist.json');
  return insertAll('api/public/comment', clist);
})
.catch(function (err) {
  console.log("ERR:", err);
});
