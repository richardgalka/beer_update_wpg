var koa = require('koa');
var helmet = require('koa-helmet');
var route = require('koa-route');
var logger = require('koa-logger')
var assert = require('assert');
var db = require('monk')('localhost/beer');
var wrap = require('./api/monk_wrap.js');
var api = require('./api/api.js');

var app = koa();

/* App settings */
app.name = 'Beer View';
app.env = 'development';
app.use(helmet());
app.use(logger());

/* Catch Errors */
app.use(function *errorHandler(next) {
  try {
    // catch all downstream errors
    yield next;
  } catch (err) {
    console.log('internal server error: %s %s %s', this.method, this.url, err);
    this.status = err.status || 500;
    this.body = err.message;
    if(true){
      this.app.emit('internal server error: ', err, this);
    }else{
      this.app.emit('internal server error');
    }
  }
});

// x-response-time
app.use(function *(next){
  var start = new Date;
  yield next;
  var ms = new Date - start;
  this.set('X-Response-Time', ms + 'ms');
});

// Handle 404 (and others)
app.use(function *pageNotFound(next){
  yield next;
  if (404 != this.status) return;

  // we need to explicitly set 404 here so that koa doesn't assign 200 on body
  this.status = 404;

  switch (this.accepts('html', 'json')) {
    case 'html':
      this.type = 'html';
      this.body = '<p>Page Not Found</p>';
      break;
    case 'json':
      this.body = {
        message: 'Page Not Found'
      };
      break;
    default:
      this.type = 'text';
      this.body = 'Page Not Found';
  }
})


/* Setup routes to generator fns */
app.use(route.get('/beer/id/:id', api.id));
app.use(route.get('/beer/all/:term', api.all));
app.use(route.get('/beer/all/', api.et));
app.use(route.get('/beer/single/:term', api.single));
app.use(route.get('/beer/history', api.hist));

// default route
//app.use(function *(){
  //this.body = 'Page not found';
//});

/* ERROR CATCHING */
app.on('error', function(err){
  console.log('Server error', err);
});

app.on('error', function(err, ctx){
  console.log('Server error', err, ctx);
});

app.listen(3000);
console.log('Koa listening on port 3000');
