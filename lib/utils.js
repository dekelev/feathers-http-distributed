// Handle internal network requests from remote apps
// Returns true when internal network request is received
// Any custom middlewares for external requests should be skipped when receiving an internal network request
const handleInternalRequest = function (req, options = {}) {
  const requestHeaderName = options.requestHeaderName || 'X-Feathers-Internal';
  const requestHeader = req.headers[requestHeaderName.toLowerCase()];

  if (!requestHeader) { return false; }

  const params = JSON.parse(requestHeader);

  for (const key of Object.keys(params)) { req.feathers[key] = params[key]; }

  delete req.feathers.provider;
  delete req.feathers.headers;

  return true;
};

// Removes all leading and trailing slashes from a path
const stripSlashes = function (name) {
  return name.replace(/^(\/*)|(\/*)$/g, '');
};

module.exports = {
  handleInternalRequest,
  stripSlashes
};
