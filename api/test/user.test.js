require('./test_helper');
const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const app = express();
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

app.get('/api/user', function(req, res) {
    return userController.protectedGet(swaggerParams, res);
});
app.get('/api/user/:id', function(req, res) { 
    let swaggerWithExtraParams = _.clone(swaggerParams);
    swaggerWithExtraParams['swagger']['params'].userId = {
        value: req.params.id
    }
    return userController.protectedGet(swaggerWithExtraParams, res);
});
  

describe('GET /User', () => {
    test('returns a list of users', done => {
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
    test('returns a single user', done => {
        let adminUser = new User({
            username: 'admin1', password: 'v3rys3cr3t', roles: ['sysadmin', 'public']
        });
        let publicUser = new User({
            username: 'joeschmo1', password: 'n0ts3cr3t', roles: ['public']
        });
        adminUser.save(error => { if (error) { console.log(error) } });
        publicUser.save(error => { if (error) { console.log(error) } });
        let publicUserId = publicUser._id.toString();;
        let uri = '/api/user/' + publicUserId
        request(app).get(uri).expect(200).then(response => {
            expect(response.body.length).toBe(1);
            let publicUserData = response.body[0];
            expect(publicUserData).toMatchObject({
                '_id': publicUserId,
                'roles': expect.arrayContaining(['public'])
            });
            done()
        });
    });
});