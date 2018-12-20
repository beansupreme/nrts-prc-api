const express = require('express');
const bodyParser = require('body-parser');
const DatabaseCleaner = require('database-cleaner');
const dbCleaner = new DatabaseCleaner('mongodb');
const mongoose = require('mongoose');
const mongooseOpts = require('../../config/mongoose_options').mongooseOptions;
const mongoDbMemoryServer = require('mongodb-memory-server');
const _ = require('lodash');
const app = express();

setupAppServer();

beforeAll(done => {
  setupInMemoryMongoServer(done);
});

afterEach(done => {
  if (mongoose.connection && mongoose.connection.db) {
    dbCleaner.clean(mongoose.connection.db, () => {done()});
  } else {
    done();
  }
});

function setupAppServer() {
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());
}

function setupInMemoryMongoServer(done) {
  const mongoServer = new mongoDbMemoryServer.default({
    instance: {},
    binary: {
      version: '3.2.21', // Mongo Version
    },
  });
  mongoServer.getConnectionString().then((mongoUri) => {
    mongoose.Promise = global.Promise;

    mongoose.connect(mongoUri, mongooseOpts);

    mongoose.connection.on('error', (e) => {
      console.log('*********** ERROR ***********');

      if (e.message.code === 'ETIMEDOUT') {
        console.log(e);
        mongoose.connect(mongoUri, mongooseOpts);
      }
      console.log(e);
      done(error);
    });

    mongoose.connection.once('open', () => {
      console.log(`MongoDB successfully connected to ${mongoUri}`);
      done();
    });
  });
}

function createSwaggerParams(fieldNames, additionalValues = {}, userID = null) {
  let defaultParams = defaultProtectedParams(fieldNames, userID);
  let swaggerObject = {
    swagger: {
      params: _.merge(defaultParams, additionalValues)
    }
  }
  return swaggerObject;
}

function createPublicSwaggerParams(fieldNames, additionalValues = {}) {
  let defaultParams = defaultPublicParams(fieldNames);
  let swaggerObject = {
    swagger: {
      params: _.merge(defaultParams, additionalValues)
    }
  }
  return swaggerObject;
}

function defaultProtectedParams(fieldNames, userID = null) {
  return {
    auth_payload: {
      scopes: ['sysadmin', 'public'],
      userID: userID
    },
    fields: {
      value: _.cloneDeep(fieldNames)
    }
  };
}
function defaultPublicParams(fieldNames) {
  return {
    fields: {
      value: _.cloneDeep(fieldNames)
    }
  };
}

function buildParams(nameValueMapping) {
  let paramObj = {}
  _.mapKeys(nameValueMapping, function(value, key) {
    paramObj[key] = { value: value };
  });
  return paramObj;
}

exports.createSwaggerParams = createSwaggerParams;
exports.createPublicSwaggerParams = createPublicSwaggerParams;
exports.buildParams = buildParams;
exports.app = app;