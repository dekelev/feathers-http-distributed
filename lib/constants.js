const DEFAULT_PROTOCOL = 'http';
const DEFAULT_TIMEOUT = 0;
const INTERNAL_REQUEST_HEADER = 'X-Internal-Request';

const AXIOS_HTTP_METHODS = {
  find: 'get',
  get: 'get',
  create: 'post',
  update: 'put',
  patch: 'patch',
  remove: 'delete'
};

module.exports = {
  DEFAULT_PROTOCOL,
  DEFAULT_TIMEOUT,
  INTERNAL_REQUEST_HEADER,
  AXIOS_HTTP_METHODS
};
