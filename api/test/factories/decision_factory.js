const factory = require('factory-girl').factory;
const Decision = require('../../helpers/models/decision');

factory.define('decision', Decision, {
  code: factory.seq('Decision.code', (n) => `decision-code-${n}`),
  isDeleted: false,
  name: factory.seq('Decision.name', (n) => `decision-${n}`),
  tags: [
    ['public'], ['sysadmin']
  ], 
});

exports.factory = factory;