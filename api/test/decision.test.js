const test_helper = require('./test_helper');
const app = test_helper.app;
const decisionFactory = require('./factories/decision_factory').factory;
const mongoose = require('mongoose');
const request = require('supertest');
let swaggerParams = {
  swagger: {
      params:{
          auth_payload:{
              scopes: [ 'sysadmin', 'public' ],
              userID: null
          },
          fields: {
            value: ['name', 'description']
          }
      }
  }
};

let publicSwaggerParams = {
  swagger: {
      params:{
        fields: {
          value: ['name', 'description']
        }
      }
  }
};

const _ = require('lodash');

const decisionController = require('../controllers/decision.js');
require('../helpers/models/decision');

var Decision = mongoose.model('Decision');

app.get('/api/decision', function(req, res) {
  return decisionController.protectedGet(swaggerParams, res);
});

app.get('/api/decision/:id', function(req, res) { 
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['decisionId'] = {
      value: req.params.id
  };
  return decisionController.protectedGet(swaggerWithExtraParams, res);
});

app.get('/api/public/decision', function(req, res) {
  return decisionController.publicGet(publicSwaggerParams, res);
});

app.get('/api/public/decision/:id', function(req, res) { 
  let swaggerWithExtraParams = _.cloneDeep(publicSwaggerParams);
  swaggerWithExtraParams['swagger']['params']['decisionId'] = {
      value: req.params.id
  };
  return decisionController.publicGet(swaggerWithExtraParams, res);
});

app.post('/api/decision/', function(req, res) {
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['decision'] = {
    value: req.body
  };
  return decisionController.protectedPost(swaggerWithExtraParams, res);
});

app.put('/api/decision/:id/publish', function(req, res) {
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['decisionId'] = {
      value: req.params.id
  };
  return decisionController.protectedPublish(swaggerWithExtraParams, res);
});

app.put('/api/decision/:id/unpublish', function(req, res) {
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['decisionId'] = {
      value: req.params.id
  };
  return decisionController.protectedUnPublish(swaggerWithExtraParams, res);
});

app.delete('/api/decision/:id', function(req, res) { 
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['decisionId'] = {
      value: req.params.id
  };
  return decisionController.protectedDelete(swaggerWithExtraParams, res);
});

const decisionsData = [
  { code: 'SPECIAL', name: 'Special Decision', description: 'We have decided to save the environment', tags: [['public'], ['sysadmin']], isDeleted: false },
  { code: 'VANILLA', name: 'Vanilla Ice Cream', description: 'Ice cream store will be built', tags: [['public']], isDeleted: false },
  { code: 'TOP_SECRET', name: 'Confidential Decision', description: 'No comment',tags: [['sysadmin']], isDeleted: false },
  { code: 'DELETED', name: 'Deleted Decision', description: 'Trolling for suckers', tags: [['public'],['sysadmin']], isDeleted: true },
];

function setupDecisions(decisionsData) {
  return new Promise(function(resolve, reject) {
    decisionFactory.createMany('decision', decisionsData).then(decisionsArray => {
      resolve(decisionsArray);
    }).catch(error => {
      reject(error);
    });
  });
}

describe('GET /decision', () => {
  test('returns a list of non-deleted, public and sysadmin decision', done => {
    setupDecisions(decisionsData).then((documents) => {
      request(app).get('/api/decision')
      .expect(200)
      .then(response =>{
        expect(response.body.length).toEqual(3);

        let firstDecision = _.find(response.body, {code: 'SPECIAL'});
        expect(firstDecision).toHaveProperty('_id');
        expect(firstDecision.description).toBe('We have decided to save the environment');
        expect(firstDecision['tags']).toEqual(expect.arrayContaining([["public"], ["sysadmin"]]));

        let secondDecision = _.find(response.body, {code: 'VANILLA'});
        expect(secondDecision).toHaveProperty('_id');
        expect(secondDecision.description).toBe('Ice cream store will be built');
        expect(secondDecision['tags']).toEqual(expect.arrayContaining([["public"]]));

        let secretDecision = _.find(response.body, {code: 'TOP_SECRET'});
        expect(secretDecision).toHaveProperty('_id');
        expect(secretDecision.description).toBe('No comment');
        expect(secretDecision['tags']).toEqual(expect.arrayContaining([["sysadmin"]]));
        done();
      });
    });
  });

  test('returns an empty array when there are no decisions', done => {
      request(app).get('/api/decision')
      .expect(200)
      .then(response => {
          expect(response.body.length).toBe(0);
          expect(response.body).toEqual([]);
          done();
      });
  });

  test.skip('querying for application', done => {
    
  });
});

describe('GET /decision/{id}', () => {
  test('returns a single Decision ', done => {
    setupDecisions(decisionsData).then((documents) => {
      Decision.findOne({code: 'SPECIAL'}).exec(function(error, decision) {
        let decisionId = decision._id.toString();
        let uri = '/api/decision/' + decisionId;
        
        request(app)
        .get(uri)
        .expect(200)
        .then(response => {
          expect(response.body.length).toBe(1);
          let responseObject = response.body[0];
          expect(responseObject).toMatchObject({
              '_id': decisionId,
              'tags': expect.arrayContaining([['public'], ['sysadmin']]),
              'code': 'SPECIAL'
          });
          done();
        });
      });;
    });
  });
});

describe('GET /public/decision', () => {
  test('returns a list of public decisions', done => {
    setupDecisions(decisionsData).then((documents) => {
      request(app).get('/api/public/decision')
      .expect(200)
      .then(response =>{
        expect(response.body.length).toEqual(2);

        let firstDecision = response.body[0];
        expect(firstDecision).toHaveProperty('_id');
        expect(firstDecision.description).toBe('We have decided to save the environment');
        expect(firstDecision['tags']).toEqual(expect.arrayContaining([["public"], ["sysadmin"]]));

        let secondDecision = response.body[1];
        expect(secondDecision).toHaveProperty('_id');
        expect(secondDecision.description).toBe('Ice cream store will be built');
        expect(secondDecision['tags']).toEqual(expect.arrayContaining([["public"]]));
        done()
      });
    });
  });

  test('returns an empty array when there are no Decisions', done => {
    request(app).get('/api/public/decision')
    .expect(200)
    .then(response => {
      expect(response.body.length).toBe(0);
      expect(response.body).toEqual([]);
      done();
    });
  });
});

describe('GET /public/decision/{id}', () => {
  test('returns a single public decision ', done => {
    setupDecisions(decisionsData).then((documents) => {
      Decision.findOne({code: 'SPECIAL'}).exec(function(error, decision) {
        if (error) { 
          console.log(error);
          throw error
        }
        let specialDecisionId = decision._id.toString();
        let uri = '/api/public/decision/' + specialDecisionId;
        
        request(app)
        .get(uri)
        .expect(200)
        .then(response => {
          expect(response.body.length).toBe(1);
          let responseObj = response.body[0];
          expect(responseObj).toMatchObject({
              '_id': specialDecisionId,
              'tags': expect.arrayContaining([['public'], ['sysadmin']]),
              code: 'SPECIAL'
          });
          done();
        });
      });;
    });
  });
});

describe('POST /decision', () => {
  test('creates a new decision', done => {
    let decisionObj = {
        name: 'Victoria',
        description: 'Victoria is a great place'
    };
    
    request(app).post('/api/decision', decisionObj)
    .send(decisionObj)
    .expect(200).then(response => {
        expect(response.body).toHaveProperty('_id');
        Decision.findById(response.body['_id']).exec(function(error, decision) {
            expect(decision).not.toBeNull();
            expect(decision.name).toBe('Victoria');
            expect(decision.description).toBe('Victoria is a great place');
            done();
        });
    });
  });

  test('defaults to sysadmin for tags and review tags', done => {
    let decisionObj = {
      name: 'Victoria',
      description: 'Victoria is a great place'
    };
    request(app).post('/api/decision', decisionObj)
    .send(decisionObj)
    .expect(200).then(response => {
      expect(response.body).toHaveProperty('_id');
      Decision.findById(response.body['_id']).exec(function(error, decision) {
        expect(decision).not.toBeNull();

        expect(decision.tags.length).toEqual(1)
        expect(decision.tags[0]).toEqual(expect.arrayContaining(['sysadmin']));

        done();
      });
    });
  });

});

describe('PUT /decision/:id', () => {
  let existingDecision;
  beforeEach(() => {
    existingDecision = new Decision({
      code: 'SOME_DECISION',
      description: 'The decision has been approved.'
    });
    return existingDecision.save();
  });

  test('updates a decision', done => {
    let updateData = {
        description: 'This decision is pending'
    };
    let uri = '/api/decision/' + existingDecision._id;
    request(app).put(uri)
    .send(updateData)
    .then(response => {
      Decision.findOne({description: 'The decision has been approved.'}).exec(function(error, decision) {
        expect(decision).toBeDefined();
        expect(decision).not.toBeNull();
        done();
      });
    });
  });

  test('404s if the decision does not exist', done => {
      let uri = '/api/decision/' + 'NON_EXISTENT_ID';
      request(app).put(uri)
      .send({description: 'hacker_man', internal: {tags: []}})
      .expect(404)
      .then(response => {
        done();
      });
  });

  test('does not allow updating tags', done => {
    let existingDecision = new Decision({
      code: 'EXISTING',
      tags: [['sysadmin']]
    });
    let updateData = {
      tags: [['public'], ['sysadmin']]
    };
    existingDecision.save().then(decision => {
      let uri = '/api/decision/' + decision._id;
      request(app).put(uri, updateData)
      .send(updateData)
      .then(response => {
        Decision.findById(decision._id).exec(function(error, updatedDecision) {
          expect(updatedDecision.tags.length).toEqual(1);
          expect(updatedDecision.tags[0]).toEqual(expect.arrayContaining(["sysadmin"]));

          done();
        });
      });
    });
  });
});

describe('PUT /decision/:id/publish', () => {
  test('publishes a decision', done => {
      let existingDecision = new Decision({
          code: 'EXISTING',
          description: 'I love this project',
          tags: []
      });
      existingDecision.save().then(decision => {
          let uri = '/api/decision/' + decision._id + '/publish';
          request(app).put(uri)
          .expect(200)
          .send({})
          .then(response => {
            Decision.findOne({code: 'EXISTING'}).exec(function(error, updatedDecision) {
              expect(updatedDecision).toBeDefined();
              expect(updatedDecision.tags[0]).toEqual(expect.arrayContaining(['public']));
              done();
            });
          });
      });
  });

  test('404s if the decision does not exist', done => {
      let uri = '/api/decision/' + 'NON_EXISTENT_ID' + '/publish';
      request(app).put(uri)
      .send({})
      .expect(404)
      .then(response => {
          done();
      });
  });
});

describe('PUT /decision/:id/unpublish', () => {
  test('unpublishes a decision', done => {
      let existingDecision = new Decision({
          code: 'EXISTING',
          description: 'I love this project',
          tags: [['public']]
      });
      existingDecision.save().then(decision => {
          let uri = '/api/decision/' + decision._id + '/unpublish';
          request(app).put(uri)
          .expect(200)
          .send({})
          .then(response => {
              Decision.findOne({code: 'EXISTING'}).exec(function(error, updatedDecision) {
                  expect(updatedDecision).toBeDefined();
                  expect(updatedDecision.tags[0]).toEqual(expect.arrayContaining([]));
                  done();
              });
          });
      });
  });

  test('404s if the decision does not exist', done => {
      let uri = '/api/decision/' + 'NON_EXISTENT_ID' + '/unpublish';
      request(app).put(uri)
      .send({})
      .expect(404)
      .then(response => {
          done();
      });
  });
});

describe('DELETE /decision/id', () => {
  test('It soft deletes a decision', done => {
    setupDecisions(decisionsData).then((documents) => {
      Decision.findOne({code: 'VANILLA'}).exec(function(error, decision) {
        let vanillaDecisionId = decision._id.toString();
        let uri = '/api/decision/' + vanillaDecisionId;
        request(app)
        .delete(uri)
        .expect(200)
        .then(response => {
          Decision.findOne({code: 'VANILLA'}).exec(function(error, decision) {
            expect(decision.isDeleted).toBe(true);
            done();
          });
        });
      });
    });
  });

  test('404s if the decision does not exist', done => {
    let uri = '/api/decision/' + 'NON_EXISTENT_ID';
    request(app)
    .delete(uri)
    .expect(404)
    .then(response => {
        done();
    });
  });
});