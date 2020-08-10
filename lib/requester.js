const axios = require('axios');
const { pathToHost, idToString } = require('./utils');
const {
  DEFAULT_HTTP_PROTOCOL,
  DEFAULT_PORT,
  DEFAULT_TIMEOUT,
  SERVICE_HOST_HEADER,
  SERVICE_PORT_HEADER,
  INTERNAL_REQUEST_HEADER,
  AXIOS_HTTP_METHODS
} = require('./constants');

class Requester {
  constructor (options) {
    this.protocol = options.protocol || DEFAULT_HTTP_PROTOCOL;
    this.proxyHost = options.proxy && options.proxy.host;
    this.proxyPort = options.proxy && options.proxy.port;
    this.port = options.port || DEFAULT_PORT;
    this.pathToHost = options.pathToHost || pathToHost;
    this.internalRequestHeader = options.internalRequestHeader || INTERNAL_REQUEST_HEADER;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    this.excludeParams = options.excludeParams;
    this.dnsSuffix = options.dnsSuffix || '';
  }

  async send (options) {
    const { type, path, id, data, params = {} } = options;
    const httpMethod = AXIOS_HTTP_METHODS[type];
    const protocol = params.protocol || this.protocol;
    const dnsSuffix = params.dnsSuffix !== undefined ? params.dnsSuffix : this.dnsSuffix;
    const serviceHost = (params.host || this.pathToHost(path)) + dnsSuffix;
    const servicePort = params.port || this.port;
    const host = this.proxyHost || serviceHost;
    const port = this.proxyPort || servicePort;
    const fullPath = id ? `${path}/${idToString(id)}` : path;
    const url = `${protocol}://${host}:${port}/${fullPath}`;
    const filteredParams = this.filterParams(params);

    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        [SERVICE_HOST_HEADER]: serviceHost,
        [SERVICE_PORT_HEADER]: servicePort,
        [this.internalRequestHeader]: JSON.stringify(filteredParams),
        ...params.headers
      },
      timeout: params.timeout || this.timeout
    };

    const args = data ? [url, data, requestOptions] : [url, requestOptions];
    const result = await axios[httpMethod](...args);

    return result.data;
  }

  filterParams (params) {
    if (!this.excludeParams) { return params; }

    const result = { ...params };

    for (const param of this.excludeParams) { delete result[param]; }

    return result;
  }
}

module.exports = Requester;
