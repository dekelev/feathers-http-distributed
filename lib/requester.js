const http = require('http');
const https = require('https');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const errors = require('@feathersjs/errors');
const {
  DEFAULT_PROTOCOL,
  DEFAULT_TIMEOUT,
  INTERNAL_REQUEST_HEADER,
  AXIOS_HTTP_METHODS
} = require('./constants');

class Requester {
  constructor (options) {
    this.protocol = options.protocol || DEFAULT_PROTOCOL;
    this.host = options.host;
    this.port = options.port;
    this.dnsSuffix = options.dnsSuffix || '';
    this.pathToHost = options.pathToHost === true ? this.getHostByPath : options.pathToHost;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    this.proxy = options.proxy;
    this.excludeParams = options.excludeParams;
    this.maxRedirects = options.maxRedirects;
    this.keepAlive = options.keepAlive;
    this.internalRequestHeader = options.internalRequestHeader || INTERNAL_REQUEST_HEADER;

    if (options.retry) { axiosRetry(axios, options.retry); }
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

    const url = this.getUrl(serviceProtocol, serviceHost, servicePort, path, id);

    let proxy = {
      ...this.proxy,
      ...params.proxy
    };

    if (!Object.keys(proxy).length) { proxy = false; }

    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        [this.internalRequestHeader]: JSON.stringify(this.filterParams(params)),
        ...params.headers
      },
      proxy,
      timeout: params.timeout !== undefined ? params.timeout : this.timeout
    };

    if (this.maxRedirects !== undefined) { requestOptions.maxRedirects = this.maxRedirects; }

    if (this.keepAlive) {
      requestOptions.httpAgent = new http.Agent({ keepAlive: true });
      requestOptions.httpsAgent = new https.Agent({ keepAlive: true });
    }

    const httpMethod = AXIOS_HTTP_METHODS[type];
    const args = data ? [url, data, requestOptions] : [url, requestOptions];
    const result = await axios[httpMethod](...args);

    return result.data;
  }

  validateProtocol (value) {
    if (value !== 'http' && value !== 'https') { throw new errors.BadRequest(`Invalid protocol ${value}`); }
  }

  validateHost (value) {
    if (!value) { throw new errors.BadRequest('Missing host'); }
  }

  validatePort (value) {
    if (!(value > 0 && value <= 65535)) { throw new errors.BadRequest(`Invalid port ${value}`); }
  }

  getProtocolPort (protocol) {
    if (protocol === 'http') { return 80; } else if (protocol === 'https') { return 443; }
  }

  getHostByPath (path) {
    return path.replace(/[^a-z0-9]/gi, '-');
  }

  getUrl (protocol, host, port, path, id) {
    const fullPath = id ? `${path}/${this.idToString(id)}` : path;
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

  idToString (id) {
    if (typeof id === 'object') { return JSON.stringify(id); }

    return id;
  }
}

module.exports = Requester;
