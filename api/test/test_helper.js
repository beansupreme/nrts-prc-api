const dbConnection  = 'mongodb://localhost/nrts-test';
const options = {
    useMongoClient: true,
    poolSize: 10,
    reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
    reconnectInterval: 500, // Reconnect every 500ms
    poolSize: 10, // Maintain up to 10 socket connections
    // If not connected, return errors immediately rather than waiting for reconnect
    bufferMaxEntries: 0,
    connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
    socketTimeoutMS: 45000 // Close sockets after 45 seconds of inactivity
};

const mongoose = require('mongoose');

beforeAll(() => {
    mongoose.connect(dbConnection, options).then(
        () => {
            require('./api/helpers/models/user');
        }
    );
});

afterAll(function(done){
    mongoose.connection.db.dropDatabase(function(){
      mongoose.connection.close(done);
    });
});