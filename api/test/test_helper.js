const express = require('express');
const bodyParser = require('body-parser');
const DatabaseCleaner = require('database-cleaner');
const dbCleaner = new DatabaseCleaner('mongodb');
const mongoose = require('mongoose');
const mongooseOpts = require('../../config/mongoose_options');
const mongoDbMemoryServer = require('mongodb-memory-server');
const app = express();

setupAppServer();

beforeAll(() => {
    setupInMemoryMongoServer();
});

afterEach(done => {
    dbCleaner.clean(mongoose.connection.db, () => { done() });
});

function setupAppServer() {
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());
}

function setupInMemoryMongoServer() {
    const mongoServer = new mongoDbMemoryServer.MongoMemoryServer();
    mongoServer.getConnectionString().then((mongoUri) => {
        mongoose.Promise = global.Promise;
        
        mongoose.connect(mongoUri, mongooseOpts);
        
        mongoose.connection.on('error', (e) => {
            if (e.message.code === 'ETIMEDOUT') {
                console.log(e);
                mongoose.connect(mongoUri, mongooseOpts);
            }
            console.log(e);
        });
        
        mongoose.connection.once('open', () => {
            console.log(`MongoDB successfully connected to ${mongoUri}`);
        });
    });
}

exports.app = app;