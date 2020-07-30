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

  constructor(options) {
    this.port = options.port || 80;
    this.protocol = options.protocol || 'http';

    if (options.debug) {
      require('axios-debug-log');

      process.env.DEBUG = process.env.DEBUG ? process.env.DEBUG + ',axios' : 'axios';
    }
  }

  async send (options) {
    const { type, path, id, data, params = {} } = options;
    const httpMethod = HTTP_METHODS[type];
    const fullPath = id ? `${path}/${this.idToString(id)}` : path;
    const url = `${this.protocol}://${path}:${this.port}/${fullPath}`;
    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        'x-feathers-internal': JSON.stringify(params)
      }
    };
    const args = data ? [url, data, requestOptions] : [url, requestOptions];

    const result = await axios[httpMethod](...args);

    return result.data;
  }

  idToString (id) {
    if (typeof id === 'object') { return JSON.stringify(id); }

    return id;
  }
}

module.exports = Requester;
