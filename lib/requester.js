const axios = require('axios');
const { pathToHost, idToString } = require('./utils');
const {
  DEFAULT_HTTP_PROTOCOL,
  DEFAULT_PORT,
  DEFAULT_TIMEOUT,
  SERVICE_PROTOCOL_HEADER,
  SERVICE_HOST_HEADER,
  SERVICE_PORT_HEADER,
  INTERNAL_REQUEST_HEADER,
  AXIOS_HTTP_METHODS
} = require('./constants');

class Requester {
  constructor (options) {
    this.protocol = options.protocol || DEFAULT_HTTP_PROTOCOL;
    this.host = options.host;
    this.port = options.port || DEFAULT_PORT;
    this.dnsSuffix = options.dnsSuffix || '';
    this.pathToHost = (options.pathToHost === undefined || options.pathToHost === true) ? pathToHost : options.pathToHost;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    this.proxyProtocol = options.proxy && options.proxy.protocol;
    this.proxyHost = options.proxy && options.proxy.host;
    this.proxyPort = options.proxy && options.proxy.port;
    this.excludeParams = options.excludeParams;
    this.internalRequestHeader = options.internalRequestHeader || INTERNAL_REQUEST_HEADER;
  }

  async send (options) {
    const { type, path, id, data, params = {} } = options;
    const httpMethod = AXIOS_HTTP_METHODS[type];
    const serviceProtocol = params.protocol || this.protocol;
    const dnsSuffix = params.dnsSuffix !== undefined ? params.dnsSuffix : this.dnsSuffix;
    const serviceHost = (params.host || this.host || (this.pathToHost && this.pathToHost(path))) + dnsSuffix;
    const servicePort = params.port || this.port;
    const protocol = this.proxyProtocol || serviceProtocol;
    const host = this.proxyHost || serviceHost;
    const port = this.proxyPort || servicePort;
    const fullPath = id ? `${path}/${idToString(id)}` : path;
    const url = `${protocol}://${host}:${port}/${fullPath}`;
    const filteredParams = this.filterParams(params);

    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        [SERVICE_PROTOCOL_HEADER]: serviceProtocol,
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
