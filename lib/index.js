const makeDebug = require('debug');
const RemoteService = require('./service');
const { stripSlashes, handleInternalRequest } = require('./utils');

const debug = makeDebug('feathers-kubernetes');

const init = function (app) {
  return function (options) {
    debug('Initializing feathers-kubernetes with options', options);

    const _getService = app.service;

    app.service = path => getService(path, app, _getService);
  };
};

function getService (path, app, _getService) {
  const location = stripSlashes(path) || '/';
  let service = app.services[location];

  if (!service) {
    app.use(location, registerService(location));
    service = app.services[location];
  }

  return service;
}

function registerService (path) {
  const service = new RemoteService(path);

  debug('Registered remote service on path ' + path);

  return service;
}

module.exports = init;
module.exports.handleInternalRequest = handleInternalRequest;
