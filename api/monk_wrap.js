/**
 * Module Dependecies
 */

var thunkify = require('thunkify');

/**
 * Methods to wrap.
 */

var methods = [
  'count',
  'distinct',
  'find',
  'findOne'
];

/**
 * Wrap 'col'
 *
 * @param {Collection} col
 * @return {Collection}
 * @api public
 */

module.exports = function(col){
  methods.forEach(function(method){
    col[method] = thunkify(col[method]);
  });

  return col;
};

