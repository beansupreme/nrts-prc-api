const test_helper = require('./test_helper');
const userFactory = require('./factories/user_factory').factory;
const app = test_helper.app;
const mongoose = require('mongoose');
const request = require('supertest');

const organizationController = require('../controllers/organization.js');

const _ = require('lodash');
require('../helpers/models/organization');
require('../helpers/models/user');
var Organization = mongoose.model('Organization');
var User = mongoose.model('User');
var authUser;
const fieldNames = [];

function paramsWithOrgId(req) {
  let params = test_helper.buildParams({'orgId': req.params.id});
  return test_helper.createSwaggerParams(fieldNames, params);
}

app.get('/api/organization', function(req, res) {
  let swaggerParams = test_helper.createSwaggerParams(fieldNames);
  return organizationController.protectedGet(swaggerParams, res);
});

app.get('/api/organization/:id', function(req, res) {
  return organizationController.protectedGet(paramsWithOrgId(req), res);
});

app.post('/api/organization', function(req, res) {
  let extraFields = test_helper.buildParams({'org': req.body});
  let params = test_helper.createSwaggerParams(fieldNames, extraFields, userID);
  return organizationController.protectedPost(params, res);
});

app.put('/api/organization/:id', function(req, res) {
  let extraFields = test_helper.buildParams({'orgId': req.params.id, 'org': req.body});
  let params = test_helper.createSwaggerParams(fieldNames, extraFields);
  return organizationController.protectedPut(params, res);
});

app.put('/api/organization/:id/publish', function(req, res) {
  return organizationController.protectedPublish(paramsWithOrgId(req), res);
});

app.put('/api/organization/:id/unpublish', function(req, res) {
  return organizationController.protectedUnPublish(paramsWithOrgId(req), res);
});

function setupUser() {
  return new Promise(function(resolve, reject) {
    if (_.isUndefined(authUser)) {
      userFactory.create('user').then(user => {
        authUser = user;
        userID = user._id;
        resolve();
      }).catch(error => {
        reject(error);
      });
    } else {
      resolve();
    }
  });
}

function setupOrganizations(organizations) {
  return new Promise(function(resolve, reject) {
    Organization.collection.insert(organizations, function(error, documents) {
      if (error) {
        reject(error);
      }
      else {
        resolve(documents)
      }
    });
  });
};
const orgs = [
  {code: 'SPECIAL', name: 'Special Organization', tags: [['public'], ['sysadmin']]},
  {code: 'VANILLA', name: 'Vanilla Ice Cream', tags: [['public']]}
];

describe('GET /Organization', () => {
  test('returns a list of organizations', done => {
    setupOrganizations(orgs).then((documents) => {
      request(app).get('/api/organization').expect(200).then(response => {
        expect(response.body.length).toEqual(2);

        let firstOrg = response.body[0];
        expect(firstOrg).toHaveProperty('_id');
        expect(firstOrg.code).toBe('SPECIAL');
        expect(firstOrg.name).toBe('Special Organization')
        // expect(firstOrg['tags']).toEqual(expect.arrayContaining(["public"], ["sysadmin"]));

        let secondOrg = response.body[1];
        expect(secondOrg).toHaveProperty('_id');
        expect(secondOrg.code).toBe('VANILLA');
        expect(secondOrg.name).toBe('Vanilla Ice Cream')
        // expect(secondOrg['tags']).toEqual(expect.arrayContaining(["public"]));
        done()
      });
    });
  });

  test('returns an empty array when there are no organizations', done => {
    request(app).get('/api/organization')
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(0);
        expect(response.body).toEqual([]);
        done();
      });
  });
});

describe('GET /organization/{id}', () => {
  test('returns a single organization', done => {
    setupOrganizations(orgs).then((documents) => {
      Organization.findOne({code: 'SPECIAL'}).exec(function(error, organization) {
        let specialOrgId = organization._id.toString();
        let uri = '/api/organization/' + specialOrgId;
        request(app).get(uri).expect(200).then(response => {
          expect(response.body.length).toBe(1);
          let specialOrgData = response.body[0];
          expect(specialOrgData).toMatchObject({
            '_id': specialOrgId,
            'tags': expect.arrayContaining([['public'], ['sysadmin']]),
            name: 'Special Organization',
            code: 'SPECIAL'
          });
          done();
        });
      });;
    });
  });
});

describe('POST /organization', () => {
  beforeEach(done => {
    setupUser().then(done);
  });

  test('creates a new organization', done => {
    let orgObject = {
      name: 'Victoria',
      code: 'victoria'
    };
    request(app).post('/api/organization', orgObject)
      .send(orgObject)
      .expect(200).then(response => {
        expect(response.body).toHaveProperty('_id');
        Organization.findOne({code: 'victoria'}).exec(function(error, organization) {
          expect(organization).toBeDefined();
          expect(organization.name).toBe('Victoria');
          done();
        });
      });
  });

  test('it sets the _addedBy to the person modifying the org', done => {
    let orgObject = {
      name: 'Victoria',
      code: 'victoria'
    };
    request(app).post('/api/organization', orgObject)
      .send(orgObject)
      .expect(200).then(response => {
        expect(response.body).toHaveProperty('_id');
        Organization.findOne({code: 'victoria'}).exec(function(error, organization) {
          expect(organization._addedBy).toEqual(userID);
          done();
        });
      });
  });
});

describe('PUT /organization/:id', () => {
  test('updates an organization', done => {
    let existingOrg = new Organization({
      code: 'EXISTING',
      name: 'Boring Org'
    });
    let updateData = {
      name: 'Exciting Org'
    };
    existingOrg.save().then(organization => {
      let uri = '/api/organization/' + organization._id;
      request(app).put(uri, updateData)
        .send(updateData)
        .then(response => {
          // expect(response.body.name).toBe('Exciting Org');
          Organization.findOne({displayName: 'Exciting Org'}).exec(function(error, org) {
            expect(org).toBeDefined();
            done();
          });
        });
    });
  });

  test('404s if the organization does not exist', done => {
    let uri = '/api/organization/' + 'NON_EXISTENT_ID';
    request(app).put(uri)
      .send({name: 'hacker_man'})
      .expect(404)
      .then(response => {
        done();
      });
  });
});


describe('PUT /organization/:id/publish', () => {
  test('publishes an organization', done => {
    let existingOrg = new Organization({
      code: 'EXISTING',
      name: 'Boring Org',
      tags: []
    });
    existingOrg.save().then(organization => {
      let uri = '/api/organization/' + organization._id + '/publish';
      request(app).put(uri)
        .expect(200)
        .send({})
        .then(response => {
          Organization.findOne({code: 'EXISTING'}).exec(function(error, org) {
            expect(org).toBeDefined();
            expect(org.tags[0]).toEqual(expect.arrayContaining(['public']));
            done();
          });
        });
    })

  });

  test('404s if the organization does not exist', done => {
    let uri = '/api/organization/' + 'NON_EXISTENT_ID' + '/publish';
    request(app).put(uri)
      .send({})
      .expect(404)
      .then(response => {
        done();
      });
  });
});

describe('PUT /organization/:id/unpublish', () => {
  test('unpublishes an organization', done => {
    let existingOrg = new Organization({
      code: 'EXISTING',
      name: 'Boring Org',
      tags: [['public']]
    });
    existingOrg.save().then(organization => {
      let uri = '/api/organization/' + organization._id + '/unpublish';
      request(app).put(uri)
        .expect(200)
        .send({})
        .then(response => {
          Organization.findOne({code: 'EXISTING'}).exec(function(error, org) {
            expect(org).toBeDefined();
            expect(org.tags[0]).toEqual(expect.arrayContaining([]));
            done();
          });
        });
    });
  });

  test('404s if the organization does not exist', done => {
    let uri = '/api/organization/' + 'NON_EXISTENT_ID' + '/unpublish';
    request(app).put(uri)
      .send({})
      .expect(404)
      .then(response => {
        done();
      });
  });
});