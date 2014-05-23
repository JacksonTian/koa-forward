var koa = require('koa');
var router = require('koa-router');
var forward = require('../');
var should = require('should');
var request = require('supertest');

var app = koa();
app.use(router(app));

app.get('/favicon.ico', forward(__dirname + '/assets/favicon.ico'));
app.get('/test.ico', forward(__dirname + '/assets/inexist.ico'));
app.get('/humans.txt', forward(__dirname + '/assets/humans.txt', {charset: 'utf-8'}));
app.get('/noext', forward(__dirname + '/assets/noext', {mime: 'text/plain'}));
app.get('/noext2', forward(__dirname + '/assets/noext'));

app.use(function* () {
  this.body = JSON.stringify({"echo": "default handle"});
});

var server = app.listen();

describe('forward', function () {
  it('should forward to /assets/favicon.ico', function (done) {
    request(server)
    .get('/favicon.ico')
    .expect(200)
    .expect('Content-Type', 'image/x-icon')
    .end(done);
  });

  it('should GET /humans.txt forward to /assets/humans.txt with charset', function (done) {
    request(server)
    .get('/humans.txt')
    .expect(200)
    .expect('Etag', '"0f83dda66a51dd284306eecfa6d9856d"')
    .expect('Content-Length', '84')
    .expect('Cache-Control', 'public, max-age=86400')
    .expect('Content-Type', 'text/plain; charset=utf-8', function (err) {
      should.not.exist(err);
      // from cache
      request(server)
      .get('/humans.txt')
      .expect(200)
      .expect('Etag', '"0f83dda66a51dd284306eecfa6d9856d"')
      .expect('Content-Length', '84')
      .expect('Cache-Control', 'public, max-age=86400')
      .expect('Content-Type', 'text/plain; charset=utf-8', done);
    });
  });

  it('should forward to err', function (done) {
    request(server)
    .get('/test.ico')
    .expect(404)
    .expect('Content-Type', 'text/plain; charset=utf-8', done);
  });

  it('should default handled', function(done){
    request(server)
    .get('/hehe')
    .expect(200)
    .expect('{"echo":"default handle"}', done);
  });

  it('should use custom mime when no extention file', function(done){
    request(server)
    .get('/noext')
    .expect(200)
    .expect('Content-Type', 'text/plain', done);
  });

  it('should default when no extention file', function(done){
    request(server)
    .get('/noext2')
    .expect(200)
    .expect('Content-Type', 'application/octet-stream', done);
  });
});
