// Removes all leading and trailing slashes from a path
const stripSlashes = function (name) {
  return name.replace(/^(\/*)|(\/*)$/g, '');
};

// Detect and handle internal network requests from remote app
// returns true if the request is internal request from remote app
// Run this first and it returns `true`, skip any custom middlewares that runs on external requests
const handleInternalRequest = function (req, options = {}) {
  const requestHeaderName = options.requestHeaderName || 'X-Feathers-Internal';
  const requestHeader = req.headers[requestHeaderName];

  if (!requestHeader) { return false; }

  const params = JSON.parse(requestHeader);

  for (const key of Object.keys(params)) { req.feathers[key] = params[key]; }

  delete req.feathers.provider;
  delete req.feathers.headers;

  return true;
};

module.exports = {
  stripSlashes,
  handleInternalRequest
};
