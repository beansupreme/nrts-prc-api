const test_helper = require('./test_helper');
const app = test_helper.app;
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
            value: ['comment']
          }
      }
  }
};

let publicSwaggerParams = {
  swagger: {
      params:{
        fields: {
          value: ['comment']
        }
      }
  }
};

const _ = require('lodash');

const commentController = require('../controllers/comment.js');
require('../helpers/models/comment');
var Comment = mongoose.model('Comment');

app.get('/api/comment', function(req, res) {
  return commentController.protectedGet(swaggerParams, res);
});

app.get('/api/comment/:id', function(req, res) { 
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['CommentId'] = {
      value: req.params.id
  };
  return commentController.protectedGet(swaggerWithExtraParams, res);
});

app.get('/api/public/comment', function(req, res) {
  return commentController.publicGet(publicSwaggerParams, res);
});

app.get('/api/public/comment/:id', function(req, res) { 
  let swaggerWithExtraParams = _.cloneDeep(publicSwaggerParams);
  swaggerWithExtraParams['swagger']['params']['CommentId'] = {
      value: req.params.id
  };
  return commentController.publicGet(swaggerWithExtraParams, res);
});

app.post('/api/public/comment/', function(req, res) {
  let swaggerWithExtraParams = _.cloneDeep(publicSwaggerParams);
  swaggerWithExtraParams['swagger']['params']['comment'] = {
    value: req.body
  };
  return commentController.unProtectedPost(swaggerWithExtraParams, res);
});

app.put('/api/comment/:id', function(req, res) {
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['CommentId'] = {
    value: req.params.id
  };
  swaggerWithExtraParams['swagger']['params']['comment'] = {
    value: req.body
  };
  return commentController.protectedPut(swaggerWithExtraParams, res);
});

app.put('/api/comment/:id/publish', function(req, res) {
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['CommentId'] = {
      value: req.params.id
  };
  return commentController.protectedPublish(swaggerWithExtraParams, res);
});

app.put('/api/comment/:id/unpublish', function(req, res) {
  let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
  swaggerWithExtraParams['swagger']['params']['CommentId'] = {
      value: req.params.id
  };
  return commentController.protectedUnPublish(swaggerWithExtraParams, res);
});


const comments = [
  { code: 'SPECIAL', name: 'Special Comment', comment: 'This Comment is so special', tags: [['public'], ['sysadmin']], isDeleted: false },
  { code: 'VANILLA', name: 'Vanilla Ice Cream', comment: 'I like Ice Cream', tags: [['public']], isDeleted: false },
  { code: 'TOP_SECRET', name: 'Confidential Comment', comment: 'This is a secret govt project',tags: [['sysadmin']], isDeleted: false },
  { code: 'DELETED', name: 'Deleted Comment', comment: 'Trolling for suckers', tags: [['public'],['sysadmin']], isDeleted: true },
];

function setupComments(comments) {
  return new Promise(function(resolve, reject) {
      Comment.collection.insert(comments, function(error, documents) {
          if (error) { 
              reject(error); 
          }
          else {
              resolve(documents) 
          }
      });
  });
};

describe('GET /Comment', () => {
  test('returns a list of non-deleted, public and sysadmin Comments', done => {
    setupComments(comments).then((documents) => {
      request(app).get('/api/comment')
      .expect(200)
      .then(response =>{
        expect(response.body.length).toEqual(3);

        let firstComment = response.body[0];
        expect(firstComment).toHaveProperty('_id');
        expect(firstComment.comment).toBe('This Comment is so special');
        expect(firstComment['tags']).toEqual(expect.arrayContaining([["public"], ["sysadmin"]]));

        let secondComment = response.body[1];
        expect(secondComment).toHaveProperty('_id');
        expect(secondComment.comment).toBe('I like Ice Cream');
        expect(secondComment['tags']).toEqual(expect.arrayContaining([["public"]]));

        let secretComment = response.body[2];
        expect(secretComment).toHaveProperty('_id');
        expect(secretComment.comment).toBe('This is a secret govt project');
        expect(secretComment['tags']).toEqual(expect.arrayContaining([["sysadmin"]]));
        done()
      });
    });
  });

  test('returns an empty array when there are no comments', done => {
      request(app).get('/api/comment')
      .expect(200)
      .then(response => {
          expect(response.body.length).toBe(0);
          expect(response.body).toEqual([]);
          done();
      });
  });
});

describe('GET /comment/{id}', () => {
  test('returns a single Comment ', done => {
    setupComments(comments).then((documents) => {
      Comment.findOne({code: 'SPECIAL'}).exec(function(error, comment) {
        let specialCommentId = comment._id.toString();
        let uri = '/api/comment/' + specialCommentId;
        
        request(app)
        .get(uri)
        .expect(200)
        .then(response => {
          expect(response.body.length).toBe(1);
          let responseObject = response.body[0];
          expect(responseObject).toMatchObject({
              '_id': specialCommentId,
              'tags': expect.arrayContaining([['public'], ['sysadmin']]),
              // comment: 'This Comment is so special'
          });
          done();
        });
      });;
    });
  });
});

describe('GET /public/comment', () => {
  test('returns a list of public Comments', done => {
    setupComments(comments).then((documents) => {
      request(app).get('/api/public/comment')
      .expect(200)
      .then(response =>{
        expect(response.body.length).toEqual(2);

        let firstComment = response.body[0];
        expect(firstComment).toHaveProperty('_id');
        expect(firstComment.comment).toBe('This Comment is so special');
        expect(firstComment['tags']).toEqual(expect.arrayContaining([["public"], ["sysadmin"]]));

        let secondComment = response.body[1];
        expect(secondComment).toHaveProperty('_id');
        expect(secondComment.comment).toBe('I like Ice Cream');
        expect(secondComment['tags']).toEqual(expect.arrayContaining([["public"]]));
        done()
      });
    });
  });

  test('returns an empty array when there are no Comments', done => {
    request(app).get('/api/public/comment')
    .expect(200)
    .then(response => {
      expect(response.body.length).toBe(0);
      expect(response.body).toEqual([]);
      done();
    });
  });
});

describe('GET /public/comment/{id}', () => {
  test('returns a single public comment ', done => {
    setupComments(comments).then((documents) => {
      Comment.findOne({code: 'SPECIAL'}).exec(function(error, comment) {
        if (error) { 
          console.log(error);
          throw error
        }
        let specialCommentId = comment._id.toString();
        let uri = '/api/public/comment/' + specialCommentId;
        
        request(app)
        .get(uri)
        .expect(200)
        .then(response => {
          expect(response.body.length).toBe(1);
          let responseObj = response.body[0];
          expect(responseObj).toMatchObject({
              '_id': specialCommentId,
              'tags': expect.arrayContaining([['public'], ['sysadmin']]),
              // comment: 'This Comment is so special'
          });
          done();
        });
      });;
    });
  });
});

describe('POST /public/comment', () => {
  test('creates a new comment', done => {
    let commentObj = {
        name: 'Victoria',
        comment: 'Victoria is a great place'
    };
    request(app).post('/api/public/comment', commentObj)
    .send(commentObj)
    .expect(200).then(response => {
        expect(response.body).toHaveProperty('_id');
        Comment.findById(response.body['_id']).exec(function(error, comment) {
            expect(comment).not.toBeNull();
            expect(comment.name).toBe('Victoria');
            expect(comment.comment).toBe('Victoria is a great place');
            done();
        });
    });
  });

  test('sets the date added and comment status to pending', done => {
    let commentObj = {
      name: 'Victoria',
      comment: 'Victoria is a great place'
    };
    request(app).post('/api/public/comment', commentObj)
    .send(commentObj)
    .expect(200).then(response => {
      expect(response.body).toHaveProperty('_id');
      Comment.findById(response.body['_id']).exec(function(error, comment) {
        expect(comment).not.toBeNull();
        expect(comment.commentStatus).toBe('Pending');
        expect(comment.dateAdded).not.toBeNull();
        done();
      });
    });
  });

  describe('tags', () => {
    test('defaults to sysadmin for tags and review tags', done => {
      let commentObj = {
        name: 'Victoria',
        comment: 'Victoria is a great place'
      };
      request(app).post('/api/public/comment', commentObj)
      .send(commentObj)
      .expect(200).then(response => {
        expect(response.body).toHaveProperty('_id');
        Comment.findById(response.body['_id']).exec(function(error, comment) {
          expect(comment).not.toBeNull();

          expect(comment.tags.length).toEqual(1)
          expect(comment.tags[0]).toEqual(expect.arrayContaining(['sysadmin']));

          expect(comment.review.tags.length).toEqual(1)
          expect(comment.review.tags[0]).toEqual(expect.arrayContaining(['sysadmin']));
          done();
        });
      });
    });

    test('sets commentAuthor tags to public, and internal tags to by default', done => {
      let commentObj = {
        name: 'Victoria',
        comment: 'Victoria is a great place'
      };
      request(app).post('/api/public/comment', commentObj)
      .send(commentObj)
      .expect(200).then(response => {
        expect(response.body).toHaveProperty('_id');
        Comment.findById(response.body['_id']).exec(function(error, comment) {
          expect(comment.commentAuthor).not.toBeNull();

          expect(comment.commentAuthor.tags.length).toEqual(2);
          expect(comment.commentAuthor.tags[0]).toEqual(expect.arrayContaining(['sysadmin']));
          expect(comment.commentAuthor.tags[1]).toEqual(expect.arrayContaining(['public']));

          expect(comment.commentAuthor.internal.tags.length).toEqual(1);
          expect(comment.commentAuthor.internal.tags[0]).toEqual(expect.arrayContaining(['sysadmin']));
          
          done();
        });
      });
    });

    test('sets commentAuthor tags to sysadmin if requestedAnonymous', done => {
      let commentObj = {
        name: 'Victoria',
        comment: 'Victoria is a great place',
        commentAuthor: {
          requestedAnonymous: true
        }
      };

      request(app).post('/api/public/comment', commentObj)
      .send(commentObj)
      .expect(200).then(response => {
        expect(response.body).toHaveProperty('_id');
        Comment.findById(response.body['_id']).exec(function(error, comment) {
          expect(comment.commentAuthor).not.toBeNull();

          expect(comment.commentAuthor.tags.length).toEqual(1);
          expect(comment.commentAuthor.tags[0]).toEqual(expect.arrayContaining(['sysadmin']));
          done();
        });
      });
    });
  });
});

describe('PUT /comment/:id', () => {
  let existingComment;
  beforeEach(() => {
    existingComment = new Comment({
      code: 'SOME_APP',
      comment: 'I like developmment.'
    });
    return existingComment.save();
  });
  test('updates an comment', done => {
    let updateData = {
        comment: 'This application is amazing!'
    };
    let uri = '/api/comment/' + existingComment._id;
    request(app).put(uri, updateData)
    .send(updateData)
    .then(response => {
      Comment.findOne({comment: 'This application is amazing!'}).exec(function(error, comment) {
        expect(comment).toBeDefined();
        expect(comment).not.toBeNull();
        done();
      });
    });
  });

  test('404s if the comment does not exist', done => {
      let uri = '/api/comment/' + 'NON_EXISTENT_ID';
      request(app).put(uri)
      .send({name: 'hacker_man'})
      .expect(404)
      .then(response => {
          done();
      });
  });

  describe('review tags', () => {
    test('sets sysadmin and public tags when commentStatus is "Accepted" ', done => {
      let updateData = {
        review: {},
        commentStatus: 'Accepted'
      };
      let uri = '/api/comment/' + existingComment._id;
      request(app).put(uri, updateData)
      .send(updateData)
      .then(response => {
        Comment.findById(existingComment._id).exec(function(error, updatedComment) {
          expect(updatedComment).not.toBeNull();
          expect(updatedComment.review).not.toBeNull();
          let reviewTags = updatedComment.review.tags;
          expect(reviewTags.length).toEqual(2);
          expect(reviewTags[0]).toEqual(expect.arrayContaining(["sysadmin"]));
          expect(reviewTags[1]).toEqual(expect.arrayContaining(["public"]));
          done();
        });
      });
    });

    test('sets sysadmin tags when commentStatus is "Pending" ', done => {
      let updateData = {
        review: {},
        commentStatus: 'Pending'
      };

      let uri = '/api/comment/' + existingComment._id;
      request(app).put(uri, updateData)
      .send(updateData)
      .then(response => {
        Comment.findById(existingComment._id).exec(function(error, updatedComment) {
          expect(updatedComment).not.toBeNull();
          expect(updatedComment.review).not.toBeNull();
          let reviewTags = updatedComment.review.tags;
          expect(reviewTags.length).toEqual(1);
          expect(reviewTags[0]).toEqual(expect.arrayContaining(["sysadmin"]));
          done();
        });
      });
    });
    test('sets sysadmin tags when commentStatus is "Rejected" ', done => {
      let updateData = {
        review: {},
        commentStatus: 'Rejected'
      };

      let uri = '/api/comment/' + existingComment._id;
      request(app).put(uri, updateData)
      .send(updateData)
      .then(response => {
        Comment.findById(existingComment._id).exec(function(error, updatedComment) {
          expect(updatedComment).not.toBeNull();
          expect(updatedComment.review).not.toBeNull();
          let reviewTags = updatedComment.review.tags;
          expect(reviewTags.length).toEqual(1);
          expect(reviewTags[0]).toEqual(expect.arrayContaining(["sysadmin"]));
          done();
        });
      });
    });
  });

  describe('comment author tags', () => {
    test('sets sysadmin tags when commentAuthor requestedAnonymous ', done => {
      let updateData = {
        commentAuthor: {
          requestedAnonymous: true
        },
      };
      let uri = '/api/comment/' + existingComment._id;
      request(app).put(uri, updateData)
      .send(updateData)
      .then(response => {
        Comment.findById(existingComment._id).exec(function(error, updatedComment) {
          expect(updatedComment).not.toBeNull();
          expect(updatedComment.commentAuthor).not.toBeNull();
          let commentAuthorTags = updatedComment.commentAuthor.tags;
          expect(commentAuthorTags.length).toEqual(1);
          expect(commentAuthorTags[0]).toEqual(expect.arrayContaining(["sysadmin"]));
          done();
        });
      });
    });

    test('sets sysadmin and public tags when requestedAnonymous is not true ', done => {
      let updateData = {
        commentAuthor: {
          requestedAnonymous: false
        }
      };
      let uri = '/api/comment/' + existingComment._id;
      request(app).put(uri, updateData)
      .send(updateData)
      .then(response => {
        Comment.findById(existingComment._id).exec(function(error, updatedComment) {
          expect(updatedComment).not.toBeNull();
          expect(updatedComment.commentAuthor).not.toBeNull();
          let commentAuthorTags = updatedComment.commentAuthor.tags;
          expect(commentAuthorTags.length).toEqual(2);
          expect(commentAuthorTags[0]).toEqual(expect.arrayContaining(["sysadmin"]));
          expect(commentAuthorTags[1]).toEqual(expect.arrayContaining(["public"]));
          done();
        });
      });
    });

    test('does not allow setting internal tags ', done => {
      let updateData = {
        commentAuthor: {
          requestedAnonymous: true,
          internal: {
            tags: [['sysadmin'], ['public']]
          }
        }
      };
      let uri = '/api/comment/' + existingComment._id;
      request(app).put(uri, updateData)
      .send(updateData)
      .then(response => {
        Comment.findById(existingComment._id).exec(function(error, updatedComment) {
          expect(updatedComment).not.toBeNull();
          expect(updatedComment.commentAuthor).not.toBeNull();
          expect(updatedComment.commentAuthor.internal).not.toBeNull();

          let commentAuthorInternalTags = updatedComment.commentAuthor.internal.tags;
          expect(commentAuthorInternalTags.length).toEqual(1);
          expect(commentAuthorInternalTags[0]).toEqual(expect.arrayContaining(["sysadmin"]));
          done();
        });
      });
    });
  });

  test('does not allow updating tags', done => {
    let existingComment = new Comment({
      code: 'EXISTING',
      tags: [['public']]
    });
    let updateData = {
      tags: [['public'], ['sysadmin']]
    };
    existingComment.save().then(comment => {
      let uri = '/api/comment/' + comment._id;
      request(app).put(uri, updateData)
      .send(updateData)
      .then(response => {
        Comment.findById(existingComment._id).exec(function(error, comment) {
          expect(comment.tags.length).toEqual(1)
          done();
        });
      });
    });
  });
});

describe('PUT /comment/:id/publish', () => {
  test('publishes an comment', done => {
      let existingComment = new Comment({
          code: 'EXISTING',
          comment: 'I love this project',
          tags: []
      });
      existingComment.save().then(comment => {
          let uri = '/api/comment/' + comment._id + '/publish';
          request(app).put(uri)
          .expect(200)
          .send({})
          .then(response => {
            Comment.findOne({code: 'EXISTING'}).exec(function(error, comment) {
              expect(comment).toBeDefined();
              expect(comment.tags[0]).toEqual(expect.arrayContaining(['public']));
              done();
            });
          });
      })
      
  });

  test('404s if the comment does not exist', done => {
      let uri = '/api/comment/' + 'NON_EXISTENT_ID' + '/publish';
      request(app).put(uri)
      .send({})
      .expect(404)
      .then(response => {
          done();
      });
  });
});

describe('PUT /comment/:id/unpublish', () => {
  test('unpublishes a comment', done => {
      let existingComment = new Comment({
          code: 'EXISTING',
          comment: 'I love this project',
          tags: [['public']]
      });
      existingComment.save().then(comment => {
          let uri = '/api/comment/' + comment._id + '/unpublish';
          request(app).put(uri)
          .expect(200)
          .send({})
          .then(response => {
              Comment.findOne({code: 'EXISTING'}).exec(function(error, updatedComment) {
                  expect(updatedComment).toBeDefined();
                  expect(updatedComment.tags[0]).toEqual(expect.arrayContaining([]));
                  done();
              });
          });
      });
  });

  test('404s if the comment does not exist', done => {
      let uri = '/api/comment/' + 'NON_EXISTENT_ID' + '/unpublish';
      request(app).put(uri)
      .send({})
      .expect(404)
      .then(response => {
          done();
      });
  });
});


