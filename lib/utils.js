const { INTERNAL_REQUEST_HEADER } = require('./constants');

// Handle internal network requests from remote apps
// Returns true when internal network request is received
// Any custom middlewares for external requests should be skipped when receiving an internal network request
const handleInternalRequest = function (req, options = {}) {
  const internalRequestHeader = options.internalRequestHeader || INTERNAL_REQUEST_HEADER;
  const requestHeader = req.headers[internalRequestHeader.toLowerCase()];

  if (!requestHeader) { return false; }

  const params = JSON.parse(requestHeader);

  for (const key of Object.keys(params)) { req.feathers[key] = params[key]; }

  delete req.feathers.provider;
  delete req.feathers.headers;

  return true;
};

// Converts path to hostname
const pathToHost = function (path) {
  return path.replace(/[^a-z0-9]/gi, '-');
};

// Converts Feathers id to string
const idToString = function (id) {
  if (typeof id === 'object') { return JSON.stringify(id); }

  return id;
};

module.exports = {
  handleInternalRequest,
  pathToHost,
  idToString
};
