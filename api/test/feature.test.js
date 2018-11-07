const test_helper = require('./test_helper');
const app = test_helper.app;
const mongoose = require('mongoose');
const request = require('supertest');

let swaggerParams = {
  swagger: {
    params:{
      auth_payload:{
        scopes: [ 'sysadmin', 'public' ]
      },
      fields: {
        value: ['tags', 'properties']
      }
    }
  }
};

let publicSwaggerParams = {
  swagger: {
    params:{
      fields: {
        value: ['tags', 'properties']
      }
    }
  }
};

const _ = require('lodash');


const featureController = require('../controllers/feature.js');
require('../helpers/models/feature');
require('../helpers/models/application');
var Feature = mongoose.model('Feature');
var Application = mongoose.model('Application');


const applicationsData = [
  { code: 'SPECIAL', name: 'Special Application', tags: [['public'], ['sysadmin']], isDeleted: false },
  { code: 'VANILLA', name: 'Vanilla Ice Cream', tags: [['public']], isDeleted: false },
  { code: 'TOP_SECRET', name: 'Confidential Application', tags: [['sysadmin']], isDeleted: false },
  { code: 'DELETED', name: 'Deleted Application', tags: [['public'],['sysadmin']], isDeleted: true },
];

var specialApplicationId,
    vanillaApplicationId,
    topSecretApplicationId,
    deletedApplicationId;

   
function setupApplications(applicationData) {
  return new Promise(function(resolve, reject) {
    Application.collection.insert(applicationData, function(error, documents) {
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

function setupFeatures() {
  let featureData = buildFeaturesData();
  return new Promise(function(resolve, reject) {
    Feature.collection.insert(featureData, function(error, documents) {
      if (error) { 
        console.log('error creating features')
        reject(error); 
      }
      else {
        resolve(documents);
      }
    });
  });
};

function buildFeaturesData() {
  return [
    {
      applicationID: specialApplicationId,
      properties: {
        TENURE_STATUS: "ACCEPTED",
        TENURE_LOCATION: "1012 Douglas St",
        DISPOSITION_TRANSACTION_SID: 222222,
      },
      tags: [['public'], ['sysadmin']],
      isDeleted: false
    },
    {
      applicationID: vanillaApplicationId,
      properties: {
        TENURE_STATUS: "ACCEPTED",
        TENURE_LOCATION: "Beacon Hill Ice Cream",
        DISPOSITION_TRANSACTION_SID: 333333,
      },
      tags: [['public']],
      isDeleted: false
    },
    {
      applicationID: topSecretApplicationId,
      properties: {
        TENURE_STATUS: "ACCEPTED",
        TENURE_LOCATION: "Pacific Naval Fleet",
        DISPOSITION_TRANSACTION_SID: 444444,
      },
      tags: [['sysadmin']],
      isDeleted: false
    },
    {
      applicationID: deletedApplicationId,
      properties: {
        TENURE_STATUS: "ACCEPTED",
        TENURE_LOCATION: "Torn down Govt Building",
        DISPOSITION_TRANSACTION_SID: 555555,
      },
      tags: [['public'],['sysadmin']],
      isDeleted: true
    },
  ]
}

beforeEach(done => {
  setupApplications(applicationsData).then((mongooseResults) => {
    insertedIds = mongooseResults.insertedIds;
    specialApplicationId = insertedIds[0];
    vanillaApplicationId = insertedIds[1];
    topSecretApplicationId = insertedIds[2];
    deletedApplicationId = insertedIds[3];
    
    done();
  });
});

app.get('/api/feature', function(req, res) {
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  if (req.query.tantalisId) { 
    swaggerWithExtraParams['swagger']['params']['tantalisId'] = {
      value: _.toInteger(req.query.tantalisId)
    };
  }
  swaggerWithExtraParams['swagger']['params']['applicationId'] = {
    value: req.query.applicationId
  };
  return featureController.protectedGet(swaggerWithExtraParams, res);
});

app.get('/api/feature/:id', function(req, res) { 
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['featureId'] = {
      value: req.params.id
  };
  swaggerWithExtraParams['swagger']['params']['fields'] = {
    value: ['tags', 'properties']
  };
  return featureController.protectedGet(swaggerWithExtraParams, res);
});

app.get('/api/public/feature', function(req, res) {
  return featureController.publicGet(publicSwaggerParams, res);
});

app.get('/api/public/feature/:id', function(req, res) { 
  let swaggerWithExtraParams = _.cloneDeep(publicSwaggerParams);
  swaggerWithExtraParams['swagger']['params']['featureId'] = {
      value: req.params.id
  };
  swaggerWithExtraParams['swagger']['params']['fields'] = {
    value: ['tags', 'properties']
  };
  return featureController.publicGet(swaggerWithExtraParams, res);
});

app.delete('/api/feature/:id', function(req, res) { 
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['featureId'] = {
      value: req.params.id
  };
  return featureController.protectedDelete(swaggerWithExtraParams, res);
});

app.delete('/api/feature/', function(req, res) { 
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  if (req.query.applicationID) { 
    swaggerWithExtraParams['swagger']['params']['applicationID'] = {
      value: req.query.applicationID
    };
  }
  
  return featureController.protectedDelete(swaggerWithExtraParams, res);
});

app.post('/api/feature/', function(req, res) {
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['feature'] = {
    value: req.body
  };
  return featureController.protectedPost(swaggerWithExtraParams, res);
});

app.put('/api/feature/:id', function(req, res) {
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['featureId'] = {
    value: req.params.id
  };
  swaggerWithExtraParams['swagger']['params']['FeatureObject'] = {
    value: req.body
  };
  return featureController.protectedPut(swaggerWithExtraParams, res);
});

app.put('/api/feature/:id/publish', function(req, res) {
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['featureId'] = {
      value: req.params.id
  };
  return featureController.protectedPublish(swaggerWithExtraParams, res);
});

app.put('/api/feature/:id/unpublish', function(req, res) {
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['featureId'] = {
      value: req.params.id
  };
  return featureController.protectedUnPublish(swaggerWithExtraParams, res);
});

describe('GET /feature', () => {
  test('returns a list of non-deleted, public and sysadmin features', done => {
    setupFeatures().then((documents) => {
      request(app).get('/api/feature')
      .expect(200)
      .then(response =>{
        expect(response.body.length).toEqual(3);

        let firstFeature = response.body[0];
        expect(firstFeature._id).not.toBeNull();
        
        expect(firstFeature).toHaveProperty('properties');
        let firstFeatureProps = firstFeature.properties
        expect(firstFeatureProps.DISPOSITION_TRANSACTION_SID).toBe(222222);
        expect(firstFeatureProps.TENURE_LOCATION).toBe("1012 Douglas St");

        let secondFeature = response.body[1];
        let secondFeatureProps = secondFeature.properties
        expect(secondFeatureProps.DISPOSITION_TRANSACTION_SID).toBe(333333);
        expect(secondFeatureProps.TENURE_LOCATION).toBe("Beacon Hill Ice Cream");

        let secretFeature = response.body[2];
        let secretFeatureProps = secretFeature.properties
        expect(secretFeatureProps.DISPOSITION_TRANSACTION_SID).toBe(444444);
        expect(secretFeatureProps.TENURE_LOCATION).toBe('Pacific Naval Fleet');

        done()
      });
    });
  });

  test('does not return tags', done => {
    setupFeatures().then((documents) => { 
      request(app).get('/api/feature')
      .expect(200)
      .then(response =>{
        let firstFeature = response.body[0];
        expect(firstFeature).not.toHaveProperty('tags');
        done();
      });
    });
  });

  test('can search based on tantalisId', done => {
    setupFeatures().then((documents) => { 
      request(app).get('/api/feature')
      .query({tantalisId: 333333})
      .expect(200)
      .then(response =>{
        expect(response.body.length).toBe(1);
        let firstFeature = response.body[0];
        expect(firstFeature).not.toHaveProperty('tags');
        expect(firstFeature._id).not.toBeNull();
        done();
      });
    });
  });

  test('can search based on applicationId', done => {
    setupFeatures().then((documents) => { 
      expect(specialApplicationId).not.toBeNull();
      expect(specialApplicationId).not.toBeUndefined();
      request(app)
      .get('/api/feature')
      .query({applicationId: specialApplicationId.toString()})
      .expect(200)
      .then(response =>{
        expect(response.body.length).toBe(1);
        let firstFeature = response.body[0];
        expect(firstFeature).not.toHaveProperty('tags');
        done();
      });
    });
  });

  test('returns an empty array when there are no Features', done => {
    request(app).get('/api/feature')
    .expect(200)
    .then(response => {
      expect(response.body.length).toBe(0);
      expect(response.body).toEqual([]);
      done();
    });
  });

  describe.skip('searching based on coordinates', () => {
    test.skip('it finds a feature from passed in coordinates', () => {});
    test.skip('it returns 400 if the coordinates are malformed', () => {});  
  });  
});

describe('GET /feature/{id}', () => {
  test('returns a single feature ', done => {
    setupFeatures().then((documents) => {
      Feature.findOne({applicationID: specialApplicationId}).exec(function(error, feature) {
        expect(feature).not.toBeNull();
        let specialFeatureId = feature._id.toString();
        let uri = '/api/feature/' + specialFeatureId;
        
        request(app)
        .get(uri)
        .expect(200)
        .then(response => {
          expect(response.body.length).toBe(1);
          let responseObject = response.body[0];
          expect(responseObject).toMatchObject({
              '_id': specialFeatureId,
              'properties': expect.objectContaining({
                'TENURE_STATUS': "ACCEPTED",
                'TENURE_LOCATION': "1012 Douglas St",
                'DISPOSITION_TRANSACTION_SID': 222222,
              })
          });
          done();
        });
      });;
    });
  });


  test.skip('404s if the feature does not exist', done => {
    let uri = '/api/feature/' + 'NON_EXISTENT_ID';
    request(app).get(uri)
    .expect(404)
    .expect(500)
    .then(done);
  });
});

describe('GET /public/feature', () => {
  test('returns a list of public features', done => {
    setupFeatures().then((documents) => {
      request(app).get('/api/public/feature')
      .expect(200)
      .then(response =>{
        expect(response.body.length).toEqual(2);

        let firstFeature = response.body[0];
        expect(firstFeature).toHaveProperty('_id');

        expect(firstFeature).toHaveProperty('properties');
        let firstFeatureProps = firstFeature.properties
        expect(firstFeatureProps.DISPOSITION_TRANSACTION_SID).toBe(222222);
        expect(firstFeatureProps.TENURE_LOCATION).toBe("1012 Douglas St");

        let secondFeature = response.body[1];
        let secondFeatureProps = secondFeature.properties
        expect(secondFeatureProps.DISPOSITION_TRANSACTION_SID).toBe(333333);
        expect(secondFeatureProps.TENURE_LOCATION).toBe("Beacon Hill Ice Cream");

        done()
      });
    });
  });

  test('returns an empty array when there are no features', done => {
    request(app).get('/api/public/feature')
    .expect(200)
    .then(response => {
      expect(response.body.length).toBe(0);
      expect(response.body).toEqual([]);
      done();
    });
  });

  test.skip('allows pagination', done => {
    
  });
});

describe('GET /public/feature/{id}', () => {
  test('returns a single public feature ', done => {
    setupFeatures().then((documents) => {
      Feature.findOne({applicationID: specialApplicationId}).exec(function(error, feature) {
        let specialFeatureId = feature._id.toString();
        let uri = '/api/public/feature/' + specialFeatureId;
        
        request(app)
        .get(uri)
        .expect(200)
        .then(response => {
          expect(response.body.length).toBe(1);
          let responseObj = response.body[0];
          expect(responseObj).toMatchObject({
              '_id': specialFeatureId,
              'properties': expect.objectContaining({
                'TENURE_STATUS': "ACCEPTED",
                'TENURE_LOCATION': "1012 Douglas St",
                'DISPOSITION_TRANSACTION_SID': 222222,
              })
          });
          done();
        });
      });;
    });
  });
});

describe('DELETE /feature/{id}', () => {
  test('It HARD deletes an feature', done => {
    setupFeatures().then((documents) => {
      Feature.findOne({applicationID: vanillaApplicationId}).exec(function(error, feature) {
        let vanillaFeatureId = feature._id.toString();
        let uri = '/api/feature/' + vanillaFeatureId;
        request(app)
        .delete(uri)
        .expect(200)
        .then(response => {
          Feature.findOne({applicationID: vanillaApplicationId}).exec(function(error, feature) {
            expect(feature).toBeNull();
            done();
          });
        });
      });
    });
  });

  test('It can delete by application id', done => {
    setupFeatures().then((documents) => {
      let uri = '/api/feature';
      request(app)
      .delete(uri)
      .query({applicationID: vanillaApplicationId.toString()})
      .expect(200)
      .then(response => {
        Feature.findOne({applicationID: vanillaApplicationId}).exec(function(error, feature) {
          expect(feature).toBeNull();
          done();
        });
      });
    });
  });


  test('returns a 400 if no keys are sent', done => {
    setupFeatures().then((documents) => {
      let uri = '/api/feature';
      request(app)
      .delete(uri)
      .query({})
      .expect(400)
      .then(response => {
        expect(response.body).toBe("Can't delete entire collection.");
        done();

      });
    });
  });
  //currently 500s when deleting a non-existent feature
  test.skip('404s if the feature does not exist', done => {
    let uri = '/api/feature/' + 'NON_EXISTENT_ID';
    request(app)
    .delete(uri)
    .expect(404)
    .then(response => {
      console.log(response)
      done();
    });
  });
});

describe('POST /feature', () => {
  let newApplicationData = { code: 'NEW_APP', name: 'Fun Application', tags: [['public'],['sysadmin']], isDeleted: false };
  let newApplicationId;
  beforeEach(done => {
    setupApplications([newApplicationData]).then((mongooseResults) => {
      insertedIds = mongooseResults.insertedIds;
      newApplicationId = insertedIds[0];
      
      done();
    });
  });

  test('creates a new feature', done => {
    let featureObj = {
      applicationID: newApplicationId,
      properties: {
        DISPOSITION_TRANSACTION_SID: 888888,
        TENURE_STATUS: "ACCEPTED",
        TENURE_LOCATION: "2975 Jutland Rd",
      }
    };
    request(app).post('/api/feature', featureObj)
    .send(featureObj)
    .expect(200).then(response => {
        expect(response.body).toHaveProperty('_id');
        Feature.findById(response.body['_id']).exec(function(error, feature) {
          expect(feature).not.toBeNull();
          expect(feature.applicationID.toString()).toBe(newApplicationId.toString());

          expect(feature).toHaveProperty('properties');
          let featureProperties = feature.properties;
          expect(featureProperties.DISPOSITION_TRANSACTION_SID).toEqual(888888);
          expect(featureProperties.TENURE_STATUS).toEqual('ACCEPTED');
          expect(featureProperties.TENURE_LOCATION).toEqual("2975 Jutland Rd");

          done();
        });
    });
  });

  test('sets tags to public and sysadmin by default', done => {
    let featureObj = {
      applicationID: newApplicationId,
      properties: {
        DISPOSITION_TRANSACTION_SID: 888888,
        TENURE_STATUS: "ACCEPTED",
        TENURE_LOCATION: "2975 Jutland Rd",
      }
    };
    request(app).post('/api/feature', featureObj)
    .send(featureObj)
    .expect(200).then(response => {
      expect(response.body).toHaveProperty('_id');
      Feature.findById(response.body['_id']).exec(function(error, feature) {
        expect(feature).not.toBeNull();

        expect(feature.tags.length).toEqual(2);
        expect(feature.tags[0]).toEqual(expect.arrayContaining(['sysadmin']));
        expect(feature.tags[1]).toEqual(expect.arrayContaining(['public']));
        
        done();
      });
    });
  });
});

describe('PUT /feature/:id', () => {
  let existingApplicationData = { code: 'NEW_APP', name: 'Old old application', tags: [['public'],['sysadmin']], isDeleted: false };
  let existingApplicationId;

  beforeEach(done => {
    setupApplications([existingApplicationData]).then((mongooseResults) => {
      insertedIds = mongooseResults.insertedIds;
      existingApplicationId = insertedIds[0];
      
      done();
    });
  });

  test('updates an feature', done => {
    let existingFeature = new Feature({
      applicationID: existingApplicationId,
      properties: {
        DISPOSITION_TRANSACTION_SID: 999999,
        TENURE_STATUS: "ACCEPTED",
        TENURE_LOCATION: "Freshiis Smelly Food",
      }
    });
    
    let updateData = {
      properties: {
        TENURE_STATUS: "REJECTED",
        TENURE_LOCATION: 'Qualcomm Second Floor'
      }
    };

    existingFeature.save().then(feature => {
      let uri = '/api/feature/' + feature._id;
      request(app).put(uri, updateData)
      .send(updateData)
      .then(response => {
        Feature.findOne({applicationID: existingApplicationId}).exec(function(error, feature) {
          expect(feature).not.toBeNull();
          expect(feature.properties).not.toBeNull()
          expect(feature.properties.TENURE_STATUS).toBe('REJECTED')
          expect(feature.properties.TENURE_LOCATION).toBe('Qualcomm Second Floor')
          done();
        });
      });
    });
  });

  test('404s if the feature does not exist', done => {
    let uri = '/api/feature/' + 'NON_EXISTENT_ID';
    request(app).put(uri)
    .send({properties: {'I_AM': 'hacker_man'}})
    .expect(404)
    .then(response => {
        done();
    });
  });

  test('does not allow updating tags', done => {
    let existingFeature = new Feature({
      applicationID: existingApplicationId,
      tags: [['public']]
    });
    let updateData = {
      tags: [['public'], ['sysadmin']]
    };
    existingFeature.save().then(feature => {
      let uri = '/api/feature/' + feature._id;
      request(app).put(uri, updateData)
      .send(updateData)
      .then(response => {
        Feature.findById(existingFeature._id).exec(function(error, feature) {
          expect(feature.tags.length).toEqual(1)
          done();
        });
      });
    });
  });
});

describe('PUT /application/:id/publish', () => {
  let existingApplicationData = { code: 'NEW_APP', name: 'Old old application', tags: [['public'],['sysadmin']], isDeleted: false };
  let existingApplicationId;

  beforeEach(done => {
    setupApplications([existingApplicationData]).then((mongooseResults) => {
      insertedIds = mongooseResults.insertedIds;
      existingApplicationId = insertedIds[0];
      
      done();
    });
  });

  let existingFeature; 

  beforeEach(() => {
    existingFeature = new Feature({
      applicationID: existingApplicationId,
      properties: {
        DISPOSITION_TRANSACTION_SID: 999999,
        TENURE_STATUS: "ACCEPTED",
        TENURE_LOCATION: "Freshiis Smelly Food",
      }
    });
    return existingFeature.save();
  });
  
  test('publishes a feature', done => {
    let uri = '/api/feature/' + existingFeature._id + '/publish';
    request(app).put(uri)
    .expect(200)
    .send({})
    .then(response => {
      Feature.findById(existingFeature._id).exec(function(error, feature) {
        expect(feature).toBeDefined();
        expect(feature).not.toBeNull();
        expect(feature.tags[0]).toEqual(expect.arrayContaining(['public']));
        done();
      });
    });
  });

  test('404s if the feature does not exist', done => {
    let uri = '/api/feature/' + 'NON_EXISTENT_ID' + '/publish';
    request(app).put(uri)
    .send({})
    .expect(404)
    .then(response => {
        done();
    });
  });
});

describe('PUT /feature/:id/unpublish', () => {
  let existingApplicationData = { code: 'NEW_APP', name: 'Old old application', tags: [['public'],['sysadmin']], isDeleted: false };
  let existingApplicationId;

  beforeEach(done => {
    setupApplications([existingApplicationData]).then((mongooseResults) => {
      insertedIds = mongooseResults.insertedIds;
      existingApplicationId = insertedIds[0];
      
      done();
    });
  });

  beforeEach(() => {
    existingFeature = new Feature({
      applicationID: existingApplicationId,
      properties: {
        DISPOSITION_TRANSACTION_SID: 999999,
        TENURE_STATUS: "ACCEPTED",
        TENURE_LOCATION: "Freshiis Smelly Food",
      },
      tags: [['public']]
    });
    return existingFeature.save();
  });
  
  test('unpublishes a feature', done => {
    let uri = '/api/feature/' + existingFeature._id + '/unpublish';
    request(app).put(uri)
    .expect(200)
    .send({})
    .then(response => {
      Feature.findById(existingFeature._id).exec(function(error, feature) {
        expect(feature).toBeDefined();
        expect(feature.tags[0]).toEqual(expect.arrayContaining([]));
        done();
      });
    });
  });

  test('404s if the feature does not exist', done => {
    let uri = '/api/feature/' + 'NON_EXISTENT_ID' + '/unpublish';
    request(app).put(uri)
    .send({})
    .expect(404)
    .then(response => {
        done();
    });
  });
});