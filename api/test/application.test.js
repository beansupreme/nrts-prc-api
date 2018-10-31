const test_helper = require('./test_helper');
const app = test_helper.app;
const mongoose = require('mongoose');
const request = require('supertest');
const nock = require('nock');
const tantalisResponse = require('./fixtures/tantalis_response.json');
let swaggerParams = {
  swagger: {
      params:{
          auth_payload:{
              scopes: [ 'sysadmin', 'public' ],
              userID: null
          },
          fields: {}
      }
  }
};

let publicSwaggerParams = {
  swagger: {
      params:{
          fields: {}
      }
  }
};
const _ = require('lodash');


const applicationController = require('../controllers/application.js');
require('../helpers/models/application');
require('../helpers/models/user');
require('../helpers/models/feature');
var Application = mongoose.model('Application');
var User = mongoose.model('User');
var Feature = mongoose.model('Feature');

const applications = [
  { code: 'SPECIAL', name: 'Special Application', tags: [['public'], ['sysadmin']], isDeleted: false },
  { code: 'VANILLA', name: 'Vanilla Ice Cream', tags: [['public']], isDeleted: false },
  { code: 'TOP_SECRET', name: 'Confidential Application', tags: [['sysadmin']], isDeleted: false },
  { code: 'DELETED', name: 'Deleted Application', tags: [['public'],['sysadmin']], isDeleted: true },
];


function setupApplications(applications) {
  return new Promise(function(resolve, reject) {
    Application.collection.insert(applications, function(error, documents) {
      if (error) { 
        console.log('error creating apps')
        reject(error); 
      }
      else {
        resolve(documents);
      }
    });
  });
};

var authUser;

function setupUser() {
    return new Promise(function(resolve, reject) {
        if (_.isUndefined(authUser)) {
            authUser = new User({
                displayName: 'Api User',
                firstName: 'Api',
                lastName: 'User',
                username: 'api_consumer',
                password: 'V3ryS3cr3tPass',
            });
            authUser.save(function(error, user) {
                if (error) { 
                    reject(error);
                } else {
                    swaggerParams['swagger']['params']['auth_payload']['userID'] = user._id
                    userID = user._id;
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
}

app.get('/api/application', function(req, res) {
  return applicationController.protectedGet(swaggerParams, res);
});

app.get('/api/application/:id', function(req, res) { 
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['appId'] = {
      value: req.params.id
  };
  return applicationController.protectedGet(swaggerWithExtraParams, res);
});

app.get('/api/public/application', function(req, res) {
  return applicationController.publicGet(publicSwaggerParams, res);
});

app.get('/api/public/application/:id', function(req, res) { 
  let swaggerWithExtraParams = _.cloneDeep(publicSwaggerParams);
  swaggerWithExtraParams['swagger']['params']['appId'] = {
      value: req.params.id
  };
  return applicationController.publicGet(swaggerWithExtraParams, res);
});

app.post('/api/application/', function(req, res) {
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['app'] = {
    value: req.body
  };
  return applicationController.protectedPost(swaggerWithExtraParams, res);
});

app.delete('/api/application/:id', function(req, res) { 
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['appId'] = {
      value: req.params.id
  };
  return applicationController.protectedDelete(swaggerWithExtraParams, res);
});

app.put('/api/application/:id', function(req, res) {
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['appId'] = {
    value: req.params.id
  };
  swaggerWithExtraParams['swagger']['params']['AppObject'] = {
    value: req.body
  };
  return applicationController.protectedPut(swaggerWithExtraParams, res);
});

app.put('/api/application/:id/publish', function(req, res) {
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['appId'] = {
      value: req.params.id
  };
  return applicationController.protectedPublish(swaggerWithExtraParams, res);
});

app.put('/api/application/:id/unpublish', function(req, res) {
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['appId'] = {
      value: req.params.id
  };
  return applicationController.protectedUnPublish(swaggerWithExtraParams, res);
});

describe('GET /application', () => {
  test('returns a list of non-deleted, public and sysadmin Applications', done => {
    setupApplications(applications).then((documents) => {
      request(app).get('/api/application')
      .expect(200)
      .then(response =>{
        expect(response.body.length).toEqual(3);

        let firstApplication = response.body[0];
        expect(firstApplication).toHaveProperty('_id');
        expect(firstApplication.code).toBe('SPECIAL');
        expect(firstApplication['tags']).toEqual(expect.arrayContaining([["public"], ["sysadmin"]]));

        let secondApplication = response.body[1];
        expect(secondApplication).toHaveProperty('_id');
        expect(secondApplication.code).toBe('VANILLA');
        expect(secondApplication['tags']).toEqual(expect.arrayContaining([["public"]]));

        let secretApplication = response.body[2];
        expect(secretApplication).toHaveProperty('_id');
        expect(secretApplication.code).toBe('TOP_SECRET');
        expect(secretApplication['tags']).toEqual(expect.arrayContaining([["sysadmin"]]));
        done()
      });
    });
  });

  test('returns an empty array when there are no Applications', done => {
    request(app).get('/api/application')
    .expect(200)
    .then(response => {
      expect(response.body.length).toBe(0);
      expect(response.body).toEqual([]);
      done();
    });
  });

  describe('pagination', () => {
    test.skip('it paginates when pageSize is present', () => {});
    test.skip('it paginates when pageNum is present', () => {});  
  });  
});

describe('GET /application/{id}', () => {
  test('returns a single Application ', done => {
    setupApplications(applications).then((documents) => {
      Application.findOne({code: 'SPECIAL'}).exec(function(error, application) {
        let specialAppId = application._id.toString();
        let uri = '/api/application/' + specialAppId;
        
        request(app)
        .get(uri)
        .expect(200)
        .then(response => {
          expect(response.body.length).toBe(1);
          let responseObject = response.body[0];
          expect(responseObject).toMatchObject({
              '_id': specialAppId,
              'tags': expect.arrayContaining([['public'], ['sysadmin']]),
              code: 'SPECIAL'
          });
          done();
        });
      });;
    });
  });
});

describe('GET /public/application', () => {
  test('returns a list of public Applications', done => {
    setupApplications(applications).then((documents) => {
      request(app).get('/api/public/application')
      .expect(200)
      .then(response =>{
        expect(response.body.length).toEqual(2);

        let firstApplication = response.body[0];
        expect(firstApplication).toHaveProperty('_id');
        expect(firstApplication.code).toBe('SPECIAL');
        expect(firstApplication['tags']).toEqual(expect.arrayContaining([["public"], ["sysadmin"]]));

        let secondApplication = response.body[1];
        expect(secondApplication).toHaveProperty('_id');
        expect(secondApplication.code).toBe('VANILLA');
        expect(secondApplication['tags']).toEqual(expect.arrayContaining([["public"]]));
        done()
      });
    });
  });

  test('returns an empty array when there are no Applications', done => {
    request(app).get('/api/public/application')
    .expect(200)
    .then(response => {
      expect(response.body.length).toBe(0);
      expect(response.body).toEqual([]);
      done();
    });
  });
});

describe('GET /public/application/{id}', () => {
  test('returns a single public application ', done => {
    setupApplications(applications).then((documents) => {
      Application.findOne({code: 'SPECIAL'}).exec(function(error, application) {
        let specialAppId = application._id.toString();
        let uri = '/api/public/application/' + specialAppId;
        
        request(app)
        .get(uri)
        .expect(200)
        .then(response => {
          expect(response.body.length).toBe(1);
          let responseObj = response.body[0];
          expect(responseObj).toMatchObject({
              '_id': specialAppId,
              'tags': expect.arrayContaining([['public'], ['sysadmin']]),
              code: 'SPECIAL'
          });
          done();
        });
      });;
    });
  });
});

describe('DELETE /application/id', () => {
  test('It soft deletes an application', done => {
    setupApplications(applications).then((documents) => {
      Application.findOne({code: 'VANILLA'}).exec(function(error, application) {
        let vanillaAppId = application._id.toString();
        let uri = '/api/application/' + vanillaAppId;
        request(app)
        .delete(uri)
        .expect(200)
        .then(response => {
          Application.findOne({code: 'VANILLA'}).exec(function(error, application) {
            expect(application.isDeleted).toBe(true);
            done();
          });
        });
      });
    });
  });

  test('404s if the application does not exist', done => {
    let uri = '/api/application/' + 'NON_EXISTENT_ID';
    request(app)
    .delete(uri)
    .expect(404)
    .then(response => {
        done();
    });
  });
});

describe('POST /application', () => {
  beforeEach(done => {
    setupUser().then(done);
  });
  const bcgwDomain = 'https://openmaps.gov.bc.ca';
  const searchPath = '/geo/pub/WHSE_TANTALIS.TA_CROWN_TENURES_SVW/ows?service=wfs&version=2.0.0&request=getfeature&typename=PUB:WHSE_TANTALIS.TA_CROWN_TENURES_SVW&outputFormat=json&srsName=EPSG:4326&CQL_FILTER=DISPOSITION_TRANSACTION_SID=';
  let applicationObj = {
    name: 'Victoria',
    code: 'victoria',
    tantalisID: 999999
  };
  var bcgw = nock(bcgwDomain);
  let urlEncodedTantalisId = `%27${applicationObj.tantalisID}%27`;
  
  describe('when bcgw finds a matching object', () => {
    beforeEach(() => {
      return bcgw.get(searchPath + urlEncodedTantalisId)
      .reply(200, tantalisResponse);
    });

    test('creates a new application', done => {
      request(app).post('/api/application', applicationObj)
      .send(applicationObj)
      .expect(200).then(response => {
        expect(response.body).toHaveProperty('_id');
        Application.findOne({code: 'victoria'}).exec(function(error, application) {
          expect(application).toBeDefined();
          expect(application.name).toBe('Victoria');
          done();
        });
      });
    });

    test('sets geographical properties', done => {
      request(app).post('/api/application', applicationObj)
      .send(applicationObj)
      .expect(200).then(response => {
        expect(response.body).toHaveProperty('_id');
        Application.findById(response.body['_id']).exec(function(error, application) {
          expect(application.areaHectares).not.toBeNull();
          expect(application.areaHectares).toBeGreaterThan(1);

          expect(application.centroid).toBeDefined();
          expect(application.centroid.length).toBe(2);

          done();
        });
      });
    });
    
    test('it sets the _addedBy to the person creating the application', done => {
      request(app).post('/api/application', applicationObj)
      .send(applicationObj)
      .expect(200).then(response => {
        expect(response.body).toHaveProperty('_id');
        Application.findOne({code: 'victoria'}).exec(function(error, application) {
          expect(application).not.toBeNull();
          expect(application._addedBy).not.toBeNull();
          expect(application._addedBy).toEqual(userID);
          done();
        });
      });
    });
  
    test('defaults to sysadmin for tags and review tags', done => {
      request(app).post('/api/application', applicationObj)
      .send(applicationObj)
      .expect(200).then(response => {
        expect(response.body).toHaveProperty('_id');
        Application.findById(response.body['_id']).exec(function(error, application) {
          expect(application).not.toBeNull();
  
          expect(application.tags.length).toEqual(1)
          expect(application.tags[0]).toEqual(expect.arrayContaining(['sysadmin']));
  
          expect(application.internal.tags.length).toEqual(1)
          expect(application.internal.tags[0]).toEqual(expect.arrayContaining(['sysadmin']));
          done();
        });
      });
    });

    test.skip('handling features', done => {
      
    });
  });

  describe('when bcgw returns an error response', () => {
    beforeEach(() => {
      return bcgw.get(searchPath + urlEncodedTantalisId)
      .reply(500, {"error": "Something went wrong"});
    });

    test.skip('throws 500 when an error is caught', done => {

      request(app).post('/api/application', applicationObj)
      .send(applicationObj)
      .expect(500)
      .catch(errorResponse => {
        done();
      });
    });

    test.skip('handles a 404 correctly', done => {
      done();
    });
  });
});

describe('PUT /application/:id', () => {
  test('updates an application', done => {
      let existingApplication = new Application({
          code: 'SOME_APP',
          name: 'Boring Application'
      });
      let updateData = {
          name: 'Exciting Application'
      };
      existingApplication.save().then(application => {
          let uri = '/api/application/' + application._id;
          request(app).put(uri, updateData)
          .send(updateData)
          .then(response => {
              Application.findOne({name: 'Exciting Application'}).exec(function(error, application) {
                  expect(application).toBeDefined();
                  expect(application).not.toBeNull();
                  done();
              });
          });
      });
  });

  test('404s if the application does not exist', done => {
      let uri = '/api/application/' + 'NON_EXISTENT_ID';
      request(app).put(uri)
      .send({name: 'hacker_man'})
      .expect(404)
      .then(response => {
          done();
      });
  });

  test('does not allow updating tags', done => {
    let existingApplication = new Application({
      code: 'EXISTING',
      tags: [['public']],
      internal: {
        tags: [['public']]
      }
    });
    let updateData = {
      tags: [['public'], ['sysadmin']],
      internal: {
        tags: [['sysadmin']]
      }
    };
    existingApplication.save().then(application => {
      let uri = '/api/application/' + application._id;
      request(app).put(uri, updateData)
      .send(updateData)
      .then(response => {
        Application.findById(existingApplication._id).exec(function(error, application) {
          expect(application.tags.length).toEqual(1)
          expect(application.internal.tags.length).toEqual(1);
          done();
        });
      });
    });
  });
});

describe('PUT /application/:id/publish', () => {
  test('publishes an application', done => {
      let existingApplication = new Application({
          code: 'EXISTING',
          name: 'Boring application',
          tags: []
      });
      existingApplication.save().then(application => {
          let uri = '/api/application/' + application._id + '/publish';
          request(app).put(uri)
          .expect(200)
          .send({})
          .then(response => {
            Application.findOne({code: 'EXISTING'}).exec(function(error, application) {
              expect(application).toBeDefined();
              expect(application.tags[0]).toEqual(expect.arrayContaining(['public']));
              done();
            });
          });
      })
      
  });

  test('404s if the application does not exist', done => {
      let uri = '/api/application/' + 'NON_EXISTENT_ID' + '/publish';
      request(app).put(uri)
      .send({})
      .expect(404)
      .then(response => {
          done();
      });
  });

  test.skip('handles feature publish', done => {
    
  });
});

describe('PUT /application/:id/unpublish', () => {
  test('unpublishes an application', done => {
      let existingApplication = new Application({
          code: 'EXISTING',
          name: 'Boring application',
          tags: [['public']]
      });
      existingApplication.save().then(application => {
          let uri = '/api/application/' + application._id + '/unpublish';
          request(app).put(uri)
          .expect(200)
          .send({})
          .then(response => {
              Application.findOne({code: 'EXISTING'}).exec(function(error, application) {
                  expect(application).toBeDefined();
                  expect(application.tags[0]).toEqual(expect.arrayContaining([]));
                  done();
              });
          });
      });
  });

  test('404s if the application does not exist', done => {
      let uri = '/api/application/' + 'NON_EXISTENT_ID' + '/unpublish';
      request(app).put(uri)
      .send({})
      .expect(404)
      .then(response => {
          done();
      });
  });

  test.skip('handles feature unpublish', done => {
    
  });
});