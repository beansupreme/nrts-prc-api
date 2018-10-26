require('./test_helper');
const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const app = express();
const DatabaseCleaner = require('database-cleaner');
var dbCleaner = new DatabaseCleaner('mongodb');

var bodyParser = require('body-parser');
const organizationController = require('../controllers/organization.js');

const _ = require('lodash');
require('../helpers/models/organization');
var Organization = mongoose.model('Organization');

const swaggerParams = {
    swagger: {
        params:{
            auth_payload:{
                scopes: [ 'sysadmin', 'public' ]
            },
            fields: {}
        }
    }
};

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get('/api/organization', function(req, res) {
    return organizationController.protectedGet(swaggerParams, res);
});

app.get('/api/organization/:id', function(req, res) { 
    let swaggerWithExtraParams = _.cloneDeep(swaggerParams);
    swaggerWithExtraParams['swagger']['params']['orgId'] = {
        value: req.params.id
    };
    return organizationController.protectedGet(swaggerWithExtraParams, res);
});

function setupOrganizations(organizations) {
    return new Promise(function(resolve, reject) {
        Organization.collection.insert(organizations, function(error, documents) {
            if (error) { 
                reject(error); 
            }
            else {
                resolve(documents) 
            }
        });
    });
};
const orgs = [
    { code: 'SPECIAL', name: 'Special Organization', tags: [['public'], ['sysadmin']] },
    { code: 'VANILLA', name: 'Vanilla Ice Cream', tags: [['public']] }
];

describe('GET /Organization', () => {
    test('returns a list of organizations', done => {
        setupOrganizations(orgs).then((documents) => {
            request(app).get('/api/organization').expect(200).then(response =>{
                expect(response.body.length).toEqual(2);
    
                let firstOrg = response.body[0];
                expect(firstOrg).toHaveProperty('_id');
                expect(firstOrg.code).toBe('SPECIAL');
                expect(firstOrg.name).toBe('Special Organization')
                // expect(firstOrg['tags']).toEqual(expect.arrayContaining(["public"], ["sysadmin"]));
    
                let secondOrg = response.body[1];
                expect(secondOrg).toHaveProperty('_id');
                expect(secondOrg.code).toBe('VANILLA');
                expect(secondOrg.name).toBe('Vanilla Ice Cream')
                // expect(secondOrg['tags']).toEqual(expect.arrayContaining(["public"]));
                done()
            });
        });
    });

    test('returns an empty array when there are no organizations', done => {
        request(app).get('/api/organization')
        .expect(200)
        .then(response => {
            expect(response.body.length).toBe(0);
            expect(response.body).toEqual([]);
            done();
        });
    });
});

describe('GET /organization/{id}', () => {
    test('returns a single organization', done => {
        setupOrganizations(orgs).then((documents) => {
            Organization.findOne({code: 'SPECIAL'}).exec(function(error, organization) {
                let specialOrgId = organization._id.toString();
                let uri = '/api/organization/' + specialOrgId;
                request(app).get(uri).expect(200).then(response => {
                    expect(response.body.length).toBe(1);
                    let specialOrgData = response.body[0];
                    expect(specialOrgData).toMatchObject({
                        '_id': specialOrgId,
                        'tags': expect.arrayContaining([['public'], ['sysadmin']]),
                        name: 'Special Organization',
                        code: 'SPECIAL'
                    });
                    done();
                });
            });;
        });
    });
});
