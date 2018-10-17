## ACRD API (master)

Minimal API for the ACRD [Public](https://github.com/bcgov/nrts-prc-public) and [Admin](https://github.com/bcgov/nrts-prc-admin) apps

## How to run this
 
Start the server by running `npm start`

Check the swagger-ui on `http://localhost:3000/api/docs`

1) POST `http://localhost:3000/api/login/token` with the following body
``
{
"username": #{username},
"password": #{password}
}
``

 and take the token that you get in the response
 
 2) GET `http://localhost:3000/api/application` again with the following header
 ``Authorization: Bearer _TOKEN_``, replacing `_TOKEN_ ` with the value you got from that request

## Initial Setup

1) Start server and create database by running `npm start` in root

2) Add Admin user to users collection

    ``
    db.users.insert({  "username": #{username}, "password": #{password}, roles: [['sysadmin'],['public']] })
    ``

3) Seed local database as described in [seed README](seed/README.md)


