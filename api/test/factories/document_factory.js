const factory = require('factory-girl').factory;
const Document = require('../../helpers/models/document');

factory.define('document', Document, {
  displayName: factory.chance('name'),
  documentFileName: factory.seq('Document.documentFileName', (n) => `test-document-${n}.docx`),
  tags: [['sysadmin']]
});

exports.factory = factory;