const axios = require('axios');

const HTTP_METHODS = {
  find: 'get',
  get: 'get',
  create: 'post',
  update: 'put',
  patch: 'patch',
  remove: 'delete'
};

class Requester {
  constructor (options) {
    this.protocol = options.protocol || 'http';
    this.host = options.host || null;
    this.port = options.port || 80;
    this.pathToHost = options.pathToHost || this.getHost;
    this.requestHeaderName = options.requestHeaderName || 'X-Feathers-Internal';
    this.timeout = options.timeout || 0;
    this.excludeParams = options.excludeParams || [];
  }

  async send (options) {
    const { type, path, id, data, params = {} } = options;
    const httpMethod = HTTP_METHODS[type];
    const fullPath = id ? `${path}/${this.idToString(id)}` : path;

    const host = this.host || params.host || this.pathToHost(path);
    const protocol = params.protocol || this.protocol;
    const port = params.port || this.port;
    const url = `${protocol}://${host}:${port}/${fullPath}`;
    const filteredParams = { ...params };

    for (const param of this.excludeParams)
      delete filteredParams[param];

    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        [this.requestHeaderName]: JSON.stringify(filteredParams),
        ...params.headers
      },
      timeout: params.timeout || this.timeout
    };

    const args = data ? [url, data, requestOptions] : [url, requestOptions];
    const result = await axios[httpMethod](...args);

    return result.data;
  }

  idToString (id) {
    if (typeof id === 'object') { return JSON.stringify(id); }

    return id;
  }

  getHost (path) {
    return path.replace(/[^a-z0-9]/gi, '-');
  }
}

module.exports = Requester;
