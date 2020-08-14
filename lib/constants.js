const DEFAULT_PROTOCOL = 'http';
const DEFAULT_DNS_SUFFIX = '';
const DEFAULT_PORT = 80;
const DEFAULT_TIMEOUT = 0;
const SERVICE_PROTOCOL_HEADER = 'X-Service-Protocol';
const SERVICE_HOST_HEADER = 'X-Service-Host';
const SERVICE_PORT_HEADER = 'X-Service-Port';
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
  DEFAULT_DNS_SUFFIX,
  DEFAULT_PORT,
  DEFAULT_TIMEOUT,
  SERVICE_PROTOCOL_HEADER,
  SERVICE_HOST_HEADER,
  SERVICE_PORT_HEADER,
  INTERNAL_REQUEST_HEADER,
  AXIOS_HTTP_METHODS
};
