const makeDebug = require('debug');
const { handleInternalRequest } = require('./utils');
const RemoteService = require('./service');
const Requester = require('./requester');

const debug = makeDebug('feathers-http-distributed');

const init = function (app) {
  return function (options = {}) {
    debug('Initializing feathers-http-distributed with options', options);

    const requester = new Requester(options);

    app.defaultService = path => {
      debug('Registering remote service on path ' + path);

      return new RemoteService(path, requester);
    };
  };
};

module.exports = init;
module.exports.handleInternalRequest = handleInternalRequest;
