const test_helper = require('./test_helper');
const app = test_helper.app;
const mongoose = require('mongoose');
const documentFactory = require('./factories/document_factory').factory;
const commentFactory = require('./factories/comment_factory').factory;
const applicationFactory = require('./factories/application_factory').factory;
const decisionFactory = require('./factories/decision_factory').factory;
const request = require('supertest');

const _ = require('lodash');

const documentController = require('../controllers/document.js');
require('../helpers/models/document');

var Document = mongoose.model('Document');

const fieldNames = ['displayName', 'documentFileName'];

function paramsWithDocId(req) {
  let params = test_helper.buildParams({'docId': req.params.id});
  return test_helper.createSwaggerParams(fieldNames, params);
}

function publicParamsWithDocId(req) {
  let params = test_helper.buildParams({'docId': req.params.id});
  return test_helper.createPublicSwaggerParams(fieldNames, params);
}

app.get('/api/document', function(req, res) {
  let swaggerParams = test_helper.createSwaggerParams(fieldNames);
  return documentController.protectedGet(swaggerParams, res);
});

app.get('/api/document/:id', function(req, res) {
  return documentController.protectedGet(paramsWithDocId(req), res);
});

app.get('/api/public/document', function(req, res) {
  let publicSwaggerParams = test_helper.createPublicSwaggerParams(fieldNames);
  return documentController.publicGet(publicSwaggerParams, res);
});

app.get('/api/public/document/:id', function(req, res) {
  return documentController.publicGet(publicParamsWithDocId(req), res);
});

app.put('/api/document/:id/publish', function(req, res) {
  return documentController.protectedPublish(paramsWithDocId(req), res);
});

app.put('/api/document/:id/unpublish', function(req, res) {
  return documentController.protectedUnPublish(paramsWithDocId(req), res);
});

app.delete('/api/document/:id', function(req, res) {
  return documentController.protectedDelete(paramsWithDocId(req), res);
});

const documentsData = [
  {displayName: 'Special File', documentFileName: 'special_file.csv', tags: [['public'], ['sysadmin']], isDeleted: false},
  {displayName: 'Vanilla Ice Cream', documentFileName: 'vanilla.docx', tags: [['public']], isDeleted: false},
  {displayName: 'Confidential File', documentFileName: '1099_FBI.docx.gpg', tags: [['sysadmin']], isDeleted: false},
  {displayName: 'Deleted File', documentFileName: 'not_petya.exe', tags: [['public'], ['sysadmin']], isDeleted: true},
];

function setupDocuments(documentsData) {
  return new Promise(function(resolve, reject) {
    documentFactory.createMany('document', documentsData).then(documentsArray => {
      resolve(documentsArray);
    }).catch(error => {
      reject(error);
    });
  });
};


describe('GET /document', () => {
  test('returns a list of non-deleted, public and sysadmin documents', done => {
    setupDocuments(documentsData).then((documents) => {
      request(app).get('/api/document')
        .expect(200)
        .then(response => {
          expect(response.body.length).toEqual(3);

          let firstDocument = _.find(response.body, {documentFileName: 'special_file.csv'});
          expect(firstDocument).toHaveProperty('_id');
          expect(firstDocument.displayName).toBe('Special File');
          expect(firstDocument['tags']).toEqual(expect.arrayContaining([["public"], ["sysadmin"]]));

          let secondDocument = _.find(response.body, {documentFileName: 'vanilla.docx'});
          expect(secondDocument).toHaveProperty('_id');
          expect(secondDocument.displayName).toBe('Vanilla Ice Cream');
          expect(secondDocument['tags']).toEqual(expect.arrayContaining([["public"]]));

          let secretDocument = _.find(response.body, {documentFileName: '1099_FBI.docx.gpg'});
          expect(secretDocument).toHaveProperty('_id');
          expect(secretDocument.displayName).toBe('Confidential File');
          expect(secretDocument['tags']).toEqual(expect.arrayContaining([["sysadmin"]]));
          done();
        });
    });
  });

  test('returns an empty array when there are no documents', done => {
    request(app).get('/api/document')
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(0);
        expect(response.body).toEqual([]);
        done();
      });
  });

  test('can search based on comment', done => {
    commentFactory
      .create('comment', {name: 'Detailed comment with attachment'})
      .then(comment => {
        let documentAttrs = {
          _comment: comment.id, 
          displayName: 'Attatchment for comment', 
          documentFileName: 'long_list.docx'
        };
        documentFactory
          .create('document', documentAttrs, {public: false})
          .then(document => {
            request(app)
              .get('/api/document')
              .query({_comment: comment.id})
              .expect(200)
              .then(response => {
                expect(response.body.length).toBe(1);
                let resultingDocument = response.body[0];
                expect(resultingDocument).not.toBeNull();
                expect(resultingDocument.displayName).toBe('Attatchment for comment');
                done();
              });
          });
      });
  });

  test('can search based on application', done => {
    applicationFactory
      .create('application', {name: 'Detailed application with attachment'})
      .then(application => {
        let documentAttrs = {
          _application: application.id, 
          displayName: 'Attachment for Application', 
          documentFileName: 'long_list.docx'
        };
        documentFactory
          .create('document', documentAttrs, {public: false})
          .then(document => {
            request(app)
              .get('/api/document')
              .query({_application: application.id})
              .expect(200)
              .then(response => {
                expect(response.body.length).toBe(1);
                let resultingDocument = response.body[0];
                expect(resultingDocument).not.toBeNull();
                expect(resultingDocument.displayName).toBe('Attachment for Application');
                done();
              });
          });
      });
  });

  test('can search based on decision', done => {
    decisionFactory
      .create('decision', {name: 'Detailed decision with attachment'})
      .then(decision => {
        let documentAttrs = {
          _decision: decision.id, 
          displayName: 'Attachment for Decision', 
          documentFileName: 'long_list.docx'
        };
        documentFactory
          .create('document', documentAttrs, {public: false})
          .then(document => {
            request(app)
              .get('/api/document')
              .query({_decision: decision.id})
              .expect(200)
              .then(response => {
                expect(response.body.length).toBe(1);
                let resultingDocument = response.body[0];
                expect(resultingDocument).not.toBeNull();
                expect(resultingDocument.displayName).toBe('Attachment for Decision');
                done();
              });
          });
      });
  });
});

describe('GET /document/{id}', () => {
  test('returns a single Document ', done => {
    setupDocuments(documentsData).then((documents) => {
      Document.findOne({displayName: 'Special File'}).exec(function(error, document) {
        let documentId = document._id.toString();
        let uri = '/api/document/' + documentId;

        request(app)
          .get(uri)
          .expect(200)
          .then(response => {
            expect(response.body.length).toBe(1);
            let responseObject = response.body[0];
            expect(responseObject).toMatchObject({
              '_id': documentId,
              'tags': expect.arrayContaining([['public'], ['sysadmin']]),
              'displayName': 'Special File',
              'documentFileName': 'special_file.csv'
            });
            done();
          });
      });;
    });
  });
});

describe('GET /public/document', () => {
  test('returns a list of public documents', done => {
    setupDocuments(documentsData).then((documents) => {
      request(app).get('/api/public/document')
        .expect(200)
        .then(response => {
          expect(response.body.length).toEqual(2);

          let firstDocument = _.find(response.body, {documentFileName: 'special_file.csv'});
          expect(firstDocument).toHaveProperty('_id');
          expect(firstDocument.displayName).toBe('Special File');
          expect(firstDocument['tags']).toEqual(expect.arrayContaining([["public"], ["sysadmin"]]));

          let secondDocument = _.find(response.body, {documentFileName: 'vanilla.docx'});
          expect(secondDocument).toHaveProperty('_id');
          expect(secondDocument.displayName).toBe('Vanilla Ice Cream');
          expect(secondDocument['tags']).toEqual(expect.arrayContaining([["public"]]));

          done()
        });
    });
  });

  test('returns an empty array when there are no Documents', done => {
    request(app).get('/api/public/document')
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(0);
        expect(response.body).toEqual([]);
        done();
      });
  });

  test('can search based on comment', done => {
    commentFactory
      .create('comment', {name: 'Detailed comment with attachment'})
      .then(comment => {
        let documentAtts = {
          _comment: comment.id,
          displayName: 'Attatchment for comment',
          documentFileName: 'long_list.docx'
        };
        documentFactory
          .create('document', documentAtts, {public: true})
          .then(document => {
            request(app)
              .get('/api/public/document')
              .query({_comment: comment.id})
              .expect(200)
              .then(response => {
                expect(response.body.length).toBe(1);
                let resultingDocument = response.body[0];
                expect(resultingDocument).not.toBeNull();
                expect(resultingDocument.displayName).toBe('Attatchment for comment');
                done();
              });
          });
      });
  });

  test('can search based on application', done => {
    applicationFactory
      .create('application', {name: 'Detailed application with attachment'})
      .then(application => {
        let documentAttrs = {
          _application: application.id,
          displayName: 'Attachment for Application',
          documentFileName: 'long_list.docx'
        };
        documentFactory
          .create('document', documentAttrs, {public: true})
          .then(document => {
            request(app)
              .get('/api/public/document')
              .query({_application: application.id})
              .expect(200)
              .then(response => {
                expect(response.body.length).toBe(1);
                let resultingDocument = response.body[0];
                expect(resultingDocument).not.toBeNull();
                expect(resultingDocument.displayName).toBe('Attachment for Application');
                done();
              });
          });
      });
  });

  test('can search based on decision', done => {
    decisionFactory
      .create('decision', {name: 'Detailed decision with attachment'})
      .then(decision => {
        let documentAttrs = {
          _decision: decision.id,
          displayName: 'Attachment for Decision',
          documentFileName: 'long_list.docx'
        };
        documentFactory
          .create('document', documentAttrs, {public: true})
          .then(document => {
            request(app)
              .get('/api/public/document')
              .query({_decision: decision.id})
              .expect(200)
              .then(response => {
                expect(response.body.length).toBe(1);
                let resultingDocument = response.body[0];
                expect(resultingDocument).not.toBeNull();
                expect(resultingDocument.displayName).toBe('Attachment for Decision');
                done();
              });
          });
      });
  });
});

describe('GET /public/document/{id}', () => {
  test('returns a single public document ', done => {
    setupDocuments(documentsData).then((documents) => {
      Document.findOne({displayName: 'Special File'}).exec(function(error, document) {
        if (error) {
          console.log(error);
          throw error
        }
        let specialDocumentId = document._id.toString();
        let uri = '/api/public/document/' + specialDocumentId;

        request(app)
          .get(uri)
          .expect(200)
          .then(response => {
            expect(response.body.length).toBe(1);
            let responseObj = response.body[0];
            expect(responseObj).toMatchObject({
              '_id': specialDocumentId,
              'tags': expect.arrayContaining([['public'], ['sysadmin']]),
              'displayName': 'Special File',
              'documentFileName': 'special_file.csv'
            });
            done();
          });
      });;
    });
  });
});

describe.skip('POST /document', () => {
  test.skip('sets the relationships to applicatoin, comment, and decision', done => {

  });

  test.skip('sets the displayName, documentFileName, internalMim ', done => {

  });

  test.skip('Runs a virus scan', done => {

  });
});

describe.skip('PUT /document/{:id}', () => {

});

describe.skip('GET /document/{:id}/download', () => {

});

describe.skip('POST /public/document', () => {
  test.skip('sets the relationships to applicatoin, comment, and decision', done => {

  });

  test.skip('sets the displayName, documentFileName, internalMim ', done => {

  });

  test.skip('Runs a virus scan', done => {

  });
});

describe.skip('GET /public/document/{:id}/download', () => {

});

describe('PUT /document/:id/publish', () => {
  test('publishes a document', done => {
    let existingDocumentData = {
      displayName: 'Existing Document',
      tags: []
    };
    documentFactory.create('document', existingDocumentData)
      .then(document => {
        let uri = '/api/document/' + document._id + '/publish';
        request(app).put(uri)
          .expect(200)
          .send({})
          .then(response => {
            Document.findOne({displayName: 'Existing Document'}).exec(function(error, updatedDocument) {
              expect(updatedDocument).toBeDefined();
              expect(updatedDocument.tags[0]).toEqual(expect.arrayContaining(['public']));
              done();
            });
          });
      })

  });

  test('404s if the document does not exist', done => {
    let uri = '/api/document/' + 'NON_EXISTENT_ID' + '/publish';
    request(app).put(uri)
      .send({})
      .expect(404)
      .then(response => {
        done();
      });
  });
});

describe('PUT /document/:id/unpublish', () => {
  test('unpublishes a document', done => {
    let existingDocumentData = {
      displayName: 'Existing Document',
      tags: [['public']]
    };
    documentFactory.create('document', existingDocumentData)
      .then(document => {
        let uri = '/api/document/' + document._id + '/unpublish';
        request(app).put(uri)
          .expect(200)
          .send({})
          .then(response => {
            Document.findOne({displayName: 'Existing Document'}).exec(function(error, updatedDocument) {
              expect(updatedDocument).toBeDefined();
              expect(updatedDocument.tags[0]).toEqual(expect.arrayContaining([]));
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

describe('DELETE /document/:id', () => {
  test('It soft deletes a document', done => {
    setupDocuments(documentsData).then((documents) => {
      Document.findOne({displayName: 'Vanilla Ice Cream'}).exec(function(error, document) {
        let vanillaDocumentId = document._id.toString();
        let uri = '/api/document/' + vanillaDocumentId;
        request(app)
          .delete(uri)
          .expect(200)
          .then(response => {
            Document.findOne({displayName: 'Vanilla Ice Cream'}).exec(function(error, updatedDocument) {
              expect(updatedDocument.isDeleted).toBe(true);
              done();
            });
          });
      });
    });
  });

  test('404s if the decision does not exist', done => {
    let uri = '/api/document/' + 'NON_EXISTENT_ID';
    request(app)
      .delete(uri)
      .expect(404)
      .then(response => {
        done();
      });
  });
});