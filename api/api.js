var monk = require('monk');
var wrap = require('./monk_wrap.js');
var db = monk('localhost/beer');
var beers = wrap(db.get('beers'));

function escapeRegExp(string){
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function resobj() {
  this.success = true;
  this.error = null;
  this.result = {};
};

exports.beersku = function *(sku) {
  sku = decodeURI(sku);
  var beers = wrap(db.get('beers'));
  var rbeers = yield beers.findOne({sku: sku})
  this.body = {beer:rbeers, sku:sku};
};

/**
* Get all results
*/
exports.all = function *(term){
  /* Only keys that reference strings will work */
  /* TODO: Check key is one of proper options */
  /* TODO: Provide whitelist of keys to respond with:
          - name, region, price, quantity, discontinued, date
  */
  var query = {};
  key = this.request.query.key || 'name';
  query[key] = new RegExp(escapeRegExp(term), 'i');
  var res = yield beers.find(query);
  this.body = new resobj();
  this.body.result = res;
};

exports.et = function *(){
  var res = yield beers.find(/.*/, {fields: {'_id':0, 'description':0, 'image':0}});
  this.body = new resobj();
  this.body.result = res;
};

/**
* Get single results
*/
exports.single = function *(term){
  var query = {};
  //\* TODO: Check key is one of proper options /*
  key = this.request.query.key || 'name';
  query[key] = new RegExp(escapeRegExp(term), 'i');
  var res = yield beers.findOne(query);
  this.body = new resobj();
  this.body.result = res;
};

exports.hist = function *(term){
  var query = {};
  key = this.request.query.key || 'date_added';
  var res = yield beers.distinct(key, {});
  this.body = new resobj();
  this.body.result = res;
};

