const makeDebug = require('debug');
const Requester = require('./requester');
const RemoteService = require('./service');
const handleInternalRequest = require('./middleware');

const debug = makeDebug('feathers-http-distributed');

const init = function (options = {}) {
  return function (app) {
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
