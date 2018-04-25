 module.exports = require ('../models')('Application', {
    _addedBy         : { type:'ObjectId', ref:'User', default:null },
    _proponent       : { type:'ObjectId', ref:'Organization', default:null },
    code             : { type: String, trim: true, default: ''},
    name             : { type: String, trim: true },
    // Note: Default on tag property is purely for display only, they have no real effect on the model
    // This must be done in the code.
    tags             : [[{ type: String, trim: true, default: '[["sysadmin"]]' }]],
    region           : { type: String },
    latitude         : { type: Number, default: 0.00 },
    longitude        : { type: Number, default: 0.00 },
    areaHectares     : { type: Number, default: 0.00 },
    publishDate      : { type: Date, default: Date.now },
    legalDescription : { type: String },
    agency           : { type:String, default: '' },
    cl_file          : { type:Number, default: 0 },
    mapsheet         : { type:String, default: '' },
    description      : { type:String, default: '' },
    tantalisID       : { type:Number, default: 0 },
    internalID       : { type:Number, default: 0 },
    isDeleted        : { type: Boolean, default: false },
    postID           : { type:Number, default: 0 },
    client           : { type:String, default: '' },
    internal: {
        notes   : { type: String, default: '' },
        tags    : [[{ type: String, trim: true, default: '[["sysadmin"]]' }]]
    },
});
