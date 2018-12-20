const express = require('express');
const bodyParser = require('body-parser');
const DatabaseCleaner = require('database-cleaner');
const dbCleaner = new DatabaseCleaner('mongodb');
const mongoose = require('mongoose');
const mongooseOpts = require('../../config/mongoose_options');
const mongoDbMemoryServer = require('mongodb-memory-server');
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

exports.app = app;