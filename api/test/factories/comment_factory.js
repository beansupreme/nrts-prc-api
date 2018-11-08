const factory = require('factory-girl').factory;
const Comment = require('../../helpers/models/comment');

factory.define('comment', Comment, {
  code: factory.seq('Comment.code', (n) => `comment-code-${n}`),
  comment: factory.chance('sentence'),
  name: factory.chance('name'),
  isDeleted: false,
  tags: [
    ['public'], ['sysadmin']
  ], 
});

exports.factory = factory;