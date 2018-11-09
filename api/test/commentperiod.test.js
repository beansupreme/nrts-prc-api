const test_helper = require('./test_helper');
const userFactory = require('./factories/user_factory').factory;
const app = test_helper.app;
const mongoose = require('mongoose');
const commentPeriodFactory = require('./factories/comment_period_factory').factory;
const applicationFactory = require('./factories/application_factory').factory;
const request = require('supertest');
const fieldNames = ['name', 'description'];
const _ = require('lodash');

const commentPeriodController = require('../controllers/commentperiod.js');
require('../helpers/models/commentperiod');
require('../helpers/models/user');
var User = mongoose.model('User');
var CommentPeriod = mongoose.model('CommentPeriod');

function paramsWithCommentPerId(req) {
  let params = test_helper.buildParams({'CommentPeriodId': req.params.id});
  return test_helper.createSwaggerParams(fieldNames, params);
}

function publicParamsWithCommentPerId(req) {
  let params = test_helper.buildParams({'CommentPeriodId': req.params.id});
  return test_helper.createPublicSwaggerParams(fieldNames, params);
}

app.get('/api/commentperiod', function(req, res) {
  let swaggerParams = test_helper.createSwaggerParams(fieldNames);
  return commentPeriodController.protectedGet(swaggerParams, res);
});

app.get('/api/commentperiod/:id', function(req, res) {
  return commentPeriodController.protectedGet(paramsWithCommentPerId(req), res);
});

app.get('/api/public/commentperiod', function(req, res) {
  let swaggerParams = test_helper.createSwaggerParams(fieldNames);
  return commentPeriodController.publicGet(swaggerParams, res);
});

app.get('/api/public/commentperiod/:id', function(req, res) {
  return commentPeriodController.publicGet(publicParamsWithCommentPerId(req), res);
});

app.post('/api/commentperiod/', function(req, res) {
  let extraFields = test_helper.buildParams({'_commentPeriod': req.body});
  let params = test_helper.createSwaggerParams(fieldNames, extraFields, userID);
  return commentPeriodController.protectedPost(params, res);
});

app.put('/api/commentperiod/:id', function(req, res) {
  let extraFields = test_helper.buildParams({'CommentPeriodId': req.params.id, 'cp': req.body});
  let params = test_helper.createSwaggerParams(fieldNames, extraFields, userID);
  return commentPeriodController.protectedPut(params, res);
});

app.put('/api/commentperiod/:id/publish', function(req, res) {
  return commentPeriodController.protectedPublish(paramsWithCommentPerId(req), res);
});

app.put('/api/commentperiod/:id/unpublish', function(req, res) {
  return commentPeriodController.protectedUnPublish(paramsWithCommentPerId(req), res);
});

app.delete('/api/commentperiod/:id', function(req, res) {
  return commentPeriodController.protectedDelete(paramsWithCommentPerId(req), res);
});

const commentPeriodsData = [
  {code: 'SPECIAL', name: 'Special Comment', description: 'This Comment is so special', tags: [['public'], ['sysadmin']], isDeleted: false},
  {code: 'VANILLA', name: 'Vanilla Ice Cream', description: 'I like Ice Cream', tags: [['public']], isDeleted: false},
  {code: 'TOP_SECRET', name: 'Confidential Comment', description: 'This is a secret govt project', tags: [['sysadmin']], isDeleted: false},
  {code: 'DELETED', name: 'Deleted Comment', description: 'Trolling for suckers', tags: [['public'], ['sysadmin']], isDeleted: true},
];

function setupCommentPeriods(commentPeriodsData) {
  return new Promise(function(resolve, reject) {
    commentPeriodFactory.createMany('commentperiod', commentPeriodsData).then(commentPeriodsArray => {
      resolve(commentPeriodsArray);
    }).catch(error => {
      reject(error);
    });
  });
};

function setupUser() {
  return new Promise(function(resolve, reject) {
    userFactory.build('user').then(user => {
      userID = user._id;
      resolve();
    }).catch(error => {
      reject(error);
    });
  });
}

describe('GET /commentperiod', () => {
  test('returns a list of non-deleted, public and sysadmin comment periods', done => {
    setupCommentPeriods(commentPeriodsData).then((documents) => {
      request(app).get('/api/commentperiod')
        .expect(200)
        .then(response => {
          expect(response.body.length).toEqual(3);

          let firstCommentPeriod = _.find(response.body, {name: 'Special Comment'});
          expect(firstCommentPeriod).toHaveProperty('_id');
          expect(firstCommentPeriod.description).toBe('This Comment is so special');
          expect(firstCommentPeriod['tags']).toEqual(expect.arrayContaining([["public"], ["sysadmin"]]));

          let secondCommentPeriod = _.find(response.body, {name: 'Vanilla Ice Cream'});
          expect(secondCommentPeriod).toHaveProperty('_id');
          expect(secondCommentPeriod.description).toBe('I like Ice Cream');
          expect(secondCommentPeriod['tags']).toEqual(expect.arrayContaining([["public"]]));

          let secretCommentPeriod = _.find(response.body, {name: 'Confidential Comment'});
          expect(secretCommentPeriod).toHaveProperty('_id');
          expect(secretCommentPeriod.description).toBe('This is a secret govt project');
          expect(secretCommentPeriod['tags']).toEqual(expect.arrayContaining([["sysadmin"]]));
          done()
        });
    });
  });

  test('can search based on application', done => {
    applicationFactory
      .create('application', {name: 'Detailed application with comment period'})
      .then(application => {
        let commentPeriodAttrs = {
          _application: application.id, 
          name: 'Controversial Comment Period'
        };
        commentPeriodFactory
          .create('commentperiod', commentPeriodAttrs, {public: false})
          .then(commentperiod => {
            request(app)
              .get('/api/commentperiod')
              .query({_application: application.id})
              .expect(200)
              .then(response => {
                expect(response.body.length).toBe(1);
                let resultingCommentPeriod = response.body[0];
                expect(resultingCommentPeriod).not.toBeNull();
                expect(resultingCommentPeriod.name).toBe('Controversial Comment Period');
                done();
              });
          });
      });
  });

  test('returns an empty array when there are no comment periods', done => {
    request(app).get('/api/commentperiod')
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(0);
        expect(response.body).toEqual([]);
        done();
      });
  });
});

describe('GET /commentperiod/{id}', () => {
  test('returns a single CommentPeriod ', done => {
    setupCommentPeriods(commentPeriodsData).then((documents) => {
      CommentPeriod.findOne({code: 'SPECIAL'}).exec(function(error, commentPeriod) {
        let specialCommentId = commentPeriod._id.toString();
        let uri = '/api/commentperiod/' + specialCommentId;

        request(app)
          .get(uri)
          .expect(200)
          .then(response => {
            expect(response.body.length).toBe(1);
            let responseObject = response.body[0];
            expect(responseObject).toMatchObject({
              '_id': specialCommentId,
              'tags': expect.arrayContaining([['public'], ['sysadmin']]),
              'code': 'SPECIAL'
            });
            done();
          });
      });;
    });
  });
});

describe('GET /public/commentperiod', () => {
  test('returns a list of public Comment periods', done => {
    setupCommentPeriods(commentPeriodsData).then((documents) => {
      request(app).get('/api/public/commentperiod')
        .expect(200)
        .then(response => {
          expect(response.body.length).toEqual(2);

          let firstCommentPeriod = _.find(response.body, {name: 'Special Comment'});
          expect(firstCommentPeriod).toHaveProperty('_id');
          expect(firstCommentPeriod.description).toBe('This Comment is so special');
          expect(firstCommentPeriod['tags']).toEqual(expect.arrayContaining([["public"], ["sysadmin"]]));

          let secondCommentPeriod = _.find(response.body, {name: 'Vanilla Ice Cream'});
          expect(secondCommentPeriod).toHaveProperty('_id');
          expect(secondCommentPeriod.description).toBe('I like Ice Cream');
          expect(secondCommentPeriod['tags']).toEqual(expect.arrayContaining([["public"]]));
          done()
        });
    });
  });

  test('returns an empty array when there are no CommentPeriods', done => {
    request(app).get('/api/public/commentperiod')
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(0);
        expect(response.body).toEqual([]);
        done();
      });
  });
});

describe('GET /public/commentperiod/{id}', () => {
  test('returns a single public comment period ', done => {
    setupCommentPeriods(commentPeriodsData).then((documents) => {
      CommentPeriod.findOne({code: 'SPECIAL'}).exec(function(error, commentPeriod) {
        if (error) {
          console.log(error);
          throw error
        }
        let specialCommentPeriodId = commentPeriod._id.toString();
        let uri = '/api/public/commentperiod/' + specialCommentPeriodId;

        request(app)
          .get(uri)
          .expect(200)
          .then(response => {
            expect(response.body.length).toBe(1);
            let responseObj = response.body[0];
            expect(responseObj).toMatchObject({
              '_id': specialCommentPeriodId,
              'tags': expect.arrayContaining([['public'], ['sysadmin']]),
              code: 'SPECIAL'
            });
            done();
          });
      });;
    });
  });

  test('can search based on application', done => {
    applicationFactory
      .create('application', {name: 'Detailed application with comment period'})
      .then(application => {
        let commentPeriodAttrs = {
          _application: application.id, 
          name: 'Controversial Comment Period'
        };
        commentPeriodFactory
          .create('commentperiod', commentPeriodAttrs, {public: true})
          .then(commentperiod => {
            request(app)
              .get('/api/public/commentperiod')
              .query({_application: application.id})
              .expect(200)
              .then(response => {
                expect(response.body.length).toBe(1);
                let resultingCommentPeriod = response.body[0];
                expect(resultingCommentPeriod).not.toBeNull();
                expect(resultingCommentPeriod.name).toBe('Controversial Comment Period');
                done();
              });
          });
      });
  });
});

describe('POST /commentperiod', () => {
  beforeEach(done => {
    setupUser().then(done);
  });

  test('creates a new comment period', done => {
    let commentPeriodObj = {
      name: 'Victoria',
      description: 'Victoria is a great place'
    };

    request(app).post('/api/commentperiod')
      .send(commentPeriodObj)
      .expect(200).then(response => {
        expect(response.body).toHaveProperty('_id');
        CommentPeriod.findById(response.body['_id']).exec(function(error, commentPeriod) {
          expect(commentPeriod).not.toBeNull();
          expect(commentPeriod.name).toBe('Victoria');
          expect(commentPeriod.description).toBe('Victoria is a great place');
          done();
        });
      });
  });

  test('it sets the _addedBy to the person creating the comment period', done => {
    let commentPeriodObj = {
      name: 'Victoria',
      description: 'Victoria is a great place'
    };
    request(app).post('/api/commentperiod')
      .send(commentPeriodObj)
      .expect(200).then(response => {
        expect(response.body).toHaveProperty('_id');
        CommentPeriod.findById(response.body['_id']).exec(function(error, commentPeriod) {
          expect(commentPeriod).not.toBeNull();
          expect(commentPeriod._addedBy).toEqual(userID);
          // expect(commentPeriod.internal._addedBy).toEqual(userID);
          done();
        });
      });
  });


  test('defaults to sysadmin for tags and review tags', done => {
    let commentObj = {
      name: 'Victoria',
      description: 'Victoria is a great place'
    };
    request(app).post('/api/commentperiod', commentObj)
      .send(commentObj)
      .expect(200).then(response => {
        expect(response.body).toHaveProperty('_id');
        CommentPeriod.findById(response.body['_id']).exec(function(error, commentPeriod) {
          expect(commentPeriod).not.toBeNull();

          expect(commentPeriod.tags.length).toEqual(1)
          expect(commentPeriod.tags[0]).toEqual(expect.arrayContaining(['sysadmin']));

          expect(commentPeriod.internal.tags.length).toEqual(1)
          expect(commentPeriod.internal.tags[0]).toEqual(expect.arrayContaining(['sysadmin']));
          done();
        });
      });
  });

});

describe('PUT /commentperiod/:id', () => {
  let existingCommentPeriod;
  beforeEach(() => {
    existingCommentPeriod = new CommentPeriod({
      code: 'SOME_APP',
      description: 'I like developmment.',
      internal: {
        tags: []
      }
    });
    return existingCommentPeriod.save();
  });

  test('updates a comment period', done => {
    let updateData = {
      description: 'This application is amazing!',
      internal: {tags: []}
    };
    let uri = '/api/commentperiod/' + existingCommentPeriod._id;
    request(app).put(uri, updateData)
      .send(updateData)
      .then(response => {
        CommentPeriod.findOne({description: 'This application is amazing!'}).exec(function(error, commentPeriod) {
          expect(commentPeriod).toBeDefined();
          expect(commentPeriod).not.toBeNull();
          done();
        });
      });
  });

  test('404s if the comment does not exist', done => {
    let uri = '/api/commentperiod/' + 'NON_EXISTENT_ID';
    request(app).put(uri)
      .send({description: 'hacker_man', internal: {tags: []}})
      .expect(404)
      .then(response => {
        done();
      });
  });

  test('does not allow updating tags, and sets internal tags to sysadmin', done => {
    let existingCommentPeriod = new CommentPeriod({
      code: 'EXISTING',
      tags: [['sysadmin']]
    });
    let updateData = {
      tags: [['public'], ['sysadmin']],
      internal: {tags: []}
    };
    existingCommentPeriod.save().then(commentPeriod => {
      let uri = '/api/commentperiod/' + commentPeriod._id;
      request(app).put(uri)
        .send(updateData)
        .then(response => {
          CommentPeriod.findById(commentPeriod._id).exec(function(error, updatedCommentPeriod) {
            expect(updatedCommentPeriod.tags.length).toEqual(1);
            expect(updatedCommentPeriod.tags[0]).toEqual(expect.arrayContaining(["sysadmin"]));

            expect(updatedCommentPeriod.internal.tags.length).toEqual(1);
            expect(updatedCommentPeriod.internal.tags[0]).toEqual(expect.arrayContaining(["sysadmin"]));
            done();
          });
        });
    });
  });

  test.skip('does not set _addedBy', done => {

  });
});

describe('PUT /commentperiod/:id/publish', () => {
  test('publishes a comment period', done => {
    let existingCommentPeriod = new CommentPeriod({
      code: 'EXISTING',
      description: 'I love this project',
      tags: []
    });
    existingCommentPeriod.save().then(commentPeriod => {
      let uri = '/api/commentperiod/' + commentPeriod._id + '/publish';
      request(app).put(uri)
        .expect(200)
        .send({})
        .then(response => {
          CommentPeriod.findOne({code: 'EXISTING'}).exec(function(error, updatedCommentPeriod) {
            expect(updatedCommentPeriod).toBeDefined();
            expect(updatedCommentPeriod.tags[0]).toEqual(expect.arrayContaining(['public']));
            done();
          });
        });
    })

  });

  test('404s if the comment period does not exist', done => {
    let uri = '/api/commentperiod/' + 'NON_EXISTENT_ID' + '/publish';
    request(app).put(uri)
      .send({})
      .expect(404)
      .then(response => {
        done();
      });
  });
});

describe('PUT /commentperiod/:id/unpublish', () => {
  test('unpublishes a commentperiod', done => {
    let existingCommentPeriod = new CommentPeriod({
      code: 'EXISTING',
      description: 'I love this project',
      tags: [['public']]
    });
    existingCommentPeriod.save().then(commentPeriod => {
      let uri = '/api/commentperiod/' + commentPeriod._id + '/unpublish';
      request(app).put(uri)
        .expect(200)
        .send({})
        .then(response => {
          CommentPeriod.findOne({code: 'EXISTING'}).exec(function(error, updatedCommentPeriod) {
            expect(updatedCommentPeriod).toBeDefined();
            expect(updatedCommentPeriod.tags[0]).toEqual(expect.arrayContaining([]));
            done();
          });
        });
    });
  });

  test('404s if the commentPeriod does not exist', done => {
    let uri = '/api/commentperiod/' + 'NON_EXISTENT_ID' + '/unpublish';
    request(app).put(uri)
      .send({})
      .expect(404)
      .then(response => {
        done();
      });
  });
});

describe('DELETE /commentperiod/:id', () => {
  test('It soft deletes a comment period', done => {
    setupCommentPeriods(commentPeriodsData).then((documents) => {
      CommentPeriod.findOne({code: 'VANILLA'}).exec(function(error, commentPeriod) {
        let vanillaCommentPeriodId = commentPeriod._id.toString();
        let uri = '/api/commentperiod/' + vanillaCommentPeriodId;
        request(app)
          .delete(uri)
          .expect(200)
          .then(response => {
            CommentPeriod.findOne({code: 'VANILLA'}).exec(function(error, commentPeriod) {
              expect(commentPeriod.isDeleted).toBe(true);
              done();
            });
          });
      });
    });
  });

  test('404s if the comment period does not exist', done => {
    let uri = '/api/commentperiod/' + 'NON_EXISTENT_ID';
    request(app)
      .delete(uri)
      .expect(404)
      .then(response => {
        done();
      });
  });
});
