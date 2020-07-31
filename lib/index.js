require('axios-debug-log');
const makeDebug = require('debug');
const { stripSlashes, handleInternalRequest } = require('./utils');
const RemoteService = require('./service');
const Requester = require('./requester');

const debug = makeDebug('feathers-kubernetes');

const init = function (app) {
  return function (options) {
    debug('Initializing feathers-kubernetes with options', options);

    const requester = new Requester(options);
    const _getService = app.service;

    app.service = path => getService(path, app, requester, _getService);
  };
};

function getService (path, app, requester, _getService) {
  const location = stripSlashes(path) || '/';
  let service = app.services[location];

  if (!service) {
    app.use(location, registerService(location, requester));
    service = app.services[location];
  }

  return service;
}

function registerService (path, requester) {
  const service = new RemoteService(path, requester);

  debug('Registered remote service on path ' + path);

  return service;
}

module.exports = init;
module.exports.handleInternalRequest = handleInternalRequest;
