const factory = require('factory-girl').factory;
const CommentPeriod = require('../../helpers/models/commentperiod');

factory.define('commentperiod', CommentPeriod, {
  code: factory.seq('CommentPeriod.code', (n) => `comment-code-${n}`),
  comment: factory.chance('sentence'),
  name: factory.chance('name'),
  isDeleted: false,
  tags: [
    ['public'], ['sysadmin']
  ], 
});

exports.factory = factory;