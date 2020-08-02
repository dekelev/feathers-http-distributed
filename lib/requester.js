const kebabCase = require('lodash.kebabcase');
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
    this.port = options.port || 80;
    this.protocol = options.protocol || 'http';
    this.requestHeaderName = options.requestHeaderName || 'X-Feathers-Internal';
    this.timeout = options.timeout || 0;
  }

  async send (options) {
    const { type, path, id, data, params = {} } = options;
    const httpMethod = HTTP_METHODS[type];
    const fullPath = id ? `${path}/${this.idToString(id)}` : path;
    const host = options.pathToHost ? options.pathToHost(path) : this.pathToHost(path);

    const url = `${this.protocol}://${host}:${this.port}/${fullPath}`;
    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        [this.requestHeaderName]: JSON.stringify(params)
      },
      timeout: this.timeout
    };

    const args = data ? [url, data, requestOptions] : [url, requestOptions];
    const result = await axios[httpMethod](...args);

    return result.data;
  }

  idToString (id) {
    if (typeof id === 'object') { return JSON.stringify(id); }

    return id;
  }

  pathToHost (path) {
    const pathParts = path.split('/');
    let version = null;

    if (pathParts[0].match(/^v\d+/))
      version = pathParts.shift();

    let host = kebabCase(pathParts.join('/'));

    if (version)
      host = `${version}-${host}`;

    return host;
  }
}

module.exports = Requester;
