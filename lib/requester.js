const axios = require('axios');
const errors = require('@feathersjs/errors');
const { pathToHost, idToString } = require('./utils');
const {
  DEFAULT_PROTOCOL,
  DEFAULT_DNS_SUFFIX,
  DEFAULT_HTTP_PORT,
  DEFAULT_HTTPS_PORT,
  DEFAULT_TIMEOUT,
  SERVICE_PROTOCOL_HEADER,
  SERVICE_HOST_HEADER,
  SERVICE_PORT_HEADER,
  INTERNAL_REQUEST_HEADER,
  AXIOS_HTTP_METHODS
} = require('./constants');

class Requester {
  constructor (options) {
    this.protocol = options.protocol || DEFAULT_PROTOCOL;
    this.host = options.host;
    this.port = options.port;
    this.dnsSuffix = options.dnsSuffix || DEFAULT_DNS_SUFFIX;
    this.pathToHost = options.pathToHost === true ? pathToHost : options.pathToHost;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    this.proxyProtocol = options.proxy && (options.proxy.protocol || DEFAULT_PROTOCOL);
    this.proxyHost = options.proxy && options.proxy.host;
    this.proxyPort = options.proxy && (options.proxy.port || this.getProtocolPort(this.proxyProtocol));
    this.excludeParams = options.excludeParams;
    this.internalRequestHeader = options.internalRequestHeader || INTERNAL_REQUEST_HEADER;
  }

  async send (options) {
    const { type, path, id, data, params } = options;

    const serviceProtocol = params.protocol || this.protocol;
    const serviceHostPrefix = (params.host || this.host || (this.pathToHost && this.pathToHost(path)));
    const servicePort = params.port || this.port || this.getProtocolPort(serviceProtocol);

    this.validateProtocol(serviceProtocol);
    this.validateHost(serviceHostPrefix);
    this.validatePort(servicePort);

    const dnsSuffix = params.dnsSuffix !== undefined ? params.dnsSuffix : this.dnsSuffix;
    const serviceHost = serviceHostPrefix + dnsSuffix;

    const protocol = (params.proxy && params.proxy.protocol) || this.proxyProtocol || serviceProtocol;
    const host = (params.proxy && params.proxy.host) || this.proxyHost || serviceHost;
    const port = (params.proxy && (params.proxy.port || this.getProtocolPort(protocol))) || this.proxyPort || servicePort;

    this.validateProtocol(protocol);
    this.validateHost(host);
    this.validatePort(port);

    const url = this.getUrl(protocol, host, port, path, id);

    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        [SERVICE_PROTOCOL_HEADER]: serviceProtocol,
        [SERVICE_HOST_HEADER]: serviceHost,
        [SERVICE_PORT_HEADER]: servicePort,
        [this.internalRequestHeader]: JSON.stringify(this.filterParams(params)),
        ...params.headers
      },
      timeout: params.timeout || this.timeout
    };

    const httpMethod = AXIOS_HTTP_METHODS[type];
    const args = data ? [url, data, requestOptions] : [url, requestOptions];
    const result = await axios[httpMethod](...args);

    return result.data;
  }

  getProtocolPort (protocol) {
    if (protocol === 'http') { return DEFAULT_HTTP_PORT; }
    if (protocol === 'https') { return DEFAULT_HTTPS_PORT; }
  }

  validateProtocol (value) {
    if (!value) { throw new errors.BadRequest('Missing protocol'); }
    if (value !== 'http' && value !== 'https') { throw new errors.BadRequest(`Invalid protocol ${value}`); }
  }

  validateHost (value) {
    if (!value) { throw new errors.BadRequest('Missing host'); }
  }

  validatePort (value) {
    if (!value) { throw new errors.BadRequest('Missing port'); }
    if (!(value > 0 && value <= 65535)) { throw new errors.BadRequest(`Invalid port ${value}`); }
  }

  getUrl (protocol, host, port, path, id) {
    const fullPath = id ? `${path}/${idToString(id)}` : path;
    const isKnownPort = (protocol === 'http' && port === 80) || (protocol === 'https' && port === 443);
    let url = `${protocol}://${host}`;

    if (!isKnownPort) { url += `:${port}`; }

    url += `/${fullPath}`;

    return url;
  }

  filterParams (params) {
    if (!this.excludeParams) { return params; }

    const result = { ...params };

    for (const param of this.excludeParams) { delete result[param]; }

    return result;
  }
}

module.exports = Requester;
