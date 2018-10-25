require('./test_helper');
const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const app = express();

var bodyParser = require('body-parser');
const userController = require('../controllers/user.js');

const _ = require('lodash');
require('../helpers/models/user');
var User = mongoose.model('User');

const swaggerParams = {
    swagger: {
        params:{
            auth_payload:{
                scopes: [ 'sysadmin', 'public' ]
            },
            fields: {}
        }
    }
}

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get('/api/user', function(req, res) {
    return userController.protectedGet(swaggerParams, res);
});
app.get('/api/user/:id', function(req, res) { 
    let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
    swaggerWithExtraParams['swagger']['params']['userId'] = {
        value: req.params.id
    };
    return userController.protectedGet(swaggerWithExtraParams, res);
});

app.post('/api/user', function(req, res) {
    let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
    swaggerWithExtraParams['swagger']['params']['user'] = {
        value: req.body
    };
    return userController.protectedPost(swaggerWithExtraParams, res);
});

app.put('/api/user/:id', function(req, res) {
    let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
    swaggerWithExtraParams['swagger']['params']['userId'] = {
        value: req.params.id
    };
    swaggerWithExtraParams['swagger']['params']['user'] = {
        value: req.body
    };
    return userController.protectedPut(swaggerWithExtraParams, res);
});
  

describe('GET /User', () => {
    test.skip('returns a list of users', done => {
        let adminUser = User.create({
            username: 'admin', password: 'v3rys3cr3t', roles: ['sysadmin', 'public']
        });
        let publicUser = User.create({
            username: 'joeschmo', password: 'n0ts3cr3t', roles: ['public']
        });
        
        request(app).get('/api/user').expect(200).then(response =>{
            expect(response.body.length).toEqual(2);

            let firstUser = response.body[0];
            expect(firstUser).toHaveProperty('_id');
            expect(firstUser['roles']).toEqual(expect.arrayContaining(["sysadmin","public"]));

            let secondUser = response.body[1];
            expect(secondUser).toHaveProperty('_id');
            expect(secondUser['roles']).toEqual(expect.arrayContaining(["public"]));
            done()
        });
        
    });

    test.skip('returns an empty array when there are no users', done => {
        request(app).get('/api/user').expect(200).then(response => {
            expect(response.body.length).toBe(0);
            expect(response.body).toEqual([]);
            done();
        });
    });
});

describe('GET /User/{id}', () => {
    test.skip('returns a single user', done => {
        let adminUser = new User({
            username: 'admin1', password: 'v3rys3cr3t', roles: ['sysadmin', 'public']
        });
        let publicUser = new User({
            username: 'joeschmo1', password: 'n0ts3cr3t', roles: ['public']
        });
        adminUser.save(error => { if (error) { console.log(error) } });
        publicUser.save(error => { if (error) { console.log(error) } });
        let publicUserId = publicUser._id.toString();;
        let uri = '/api/user/' + publicUserId;
        request(app).get(uri).expect(200).then(response => {
            expect(response.body.length).toBe(1);
            let publicUserData = response.body[0];
            expect(publicUserData).toMatchObject({
                '_id': publicUserId,
                'roles': expect.arrayContaining(['public']),
                'displayName': 'joeschmo1',
                'tags': ['public']
            });
            done();
        });
    });
});

describe('POST /user', () => {
    test('creates a new user', done => {
        let userObject = {
            displayName: 'Lisa Helps',
            firstName: 'Lisa',
            lastName: 'Helps',
            username: 'lisahelps',
            password: 'Need_more_bike_lanes123'
        };
        request(app).post('/api/user', userObject)
        .send(userObject)
        .expect(200).then(response => {
            expect(response.body).toHaveProperty('_id');
            User.findOne({username: 'lisahelps'}).exec(function(error, user) {
                expect(user).toBeDefined();
                expect(user.firstName).toBe('Lisa');
                done();
            });
            
        });
    });
    

    // To get this test to pass, we will need a catch block around line 50 of user controller
    test.skip('requires a username and password', done => {
        let userObject = {
            displayName: 'fng',
            firstName: 'New',
            lastName: 'Guy',
            username: 'goshdarnnewguy',
            password: null
        };
        request(app).post('/api/user', userObject)
        .send(userObject)
        .then(response => {
            expect(response.status).toEqual(403)
            expect(response.body).toEqual({message: 'Username and password required'});
            done();
         })
        .catch(error => {
            done(error);
        });

    });
});

describe('PUT /user/:id', () => {
    let cookieUser = new User({
        displayName: 'Cookie Monster',
        firstName: 'Cookie',
        lastName: 'Monster',
        username: 'the_cookie_monster',
        password: 'I_am_so_quirky',
        roles: []
    });
    beforeEach(done => {
        cookieUser.save(function(error, user) {
            if (error) { 
                throw error ;
            } else {
                done();
            }
        });
    });

    test('updates a user', done => {
        let updateData = {
            displayName: 'Cookie Guy'
        };
        let uri = '/api/user/' + cookieUser._id;
        request(app).put(uri, updateData)
        .send(updateData)
        .then(response => {
            expect(response.body.displayName).toBe('Cookie Guy');
            User.findOne({displayName: 'Cookie Guy'}).exec(function(error, user) {
                expect(user).toBeDefined();
                done();
            });
         });
    });

    test('does not allow updating username', done => {
        let updateData = {
            username: 'the_carrot_monster',
            displayName: 'Cookie Guy'
        };
        let uri = '/api/user/' + cookieUser._id;
        request(app).put(uri)
        .send(updateData)
        .then(response => {
            expect(response.body.username).toBe('the_cookie_monster');
            User.findOne({username: 'the_carrot_monster'}).exec(function(error, user) {
                expect(user).toBeNull();
            }).then(() => {
                User.findOne({username: 'the_cookie_monster'}).exec(function(error, user) {
                    expect(user).not.toBeNull();
                    done();
                });
            });
        });
    });

    test('404s if the user does not exist', done => {
        let uri = '/api/user/' + 'NON_EXISTENT_ID';
        request(app).put(uri)
        .send({username: 'hacker_man'})
        .expect(404)
        .then(response => {
            done();
        });
    })

    describe('setting roles', () => {
        test('it sets the public role when the "roles" param equals "public"', done => {
            let uri = '/api/user/' + cookieUser._id;
            request(app).put(uri)
            .send({roles: 'public'})
            .then(response => {
                User.findOne({username: 'the_cookie_monster'}).exec(function(error, user) {
                    expect(user).not.toBeNull();
                    expect(user.roles).toEqual(expect.arrayContaining(['public']));
                    done();
                });
            }).catch(error => {
                console.log(error);
                done(error);
            });
        });

        test('it sets the "sysadmin" role when the "roles" param equals "sysadmin"', done => {
            let uri = '/api/user/' + cookieUser._id;
            request(app).put(uri)
            .send({roles: 'sysadmin'})
            .then(response => {
                User.findOne({username: 'the_cookie_monster'}).exec(function(error, user) {
                    expect(user).not.toBeNull();
                    expect(user.roles).toEqual(expect.arrayContaining(['sysadmin']));
                    done();
                });
            }).catch(error => {
                console.log(error);
                done(error);
            });
        });
    });
});