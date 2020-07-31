const makeDebug = require('debug');
const errorHandler = require('./errorHandler');

const debug = makeDebug('feathers-kubernetes:service');

class RemoteService {

  constructor (path, requester) {
    this.path = path;
    this.requester = requester;
    this.remote = true;
  }

  async find (params) {
    debug('Requesting find() remote service on path ' + this.path, params);
    try {
      const result = await this.requester.send({ type: 'find', path: this.path, params });
      debug('Successfully find() remote service on path ' + this.path);
      return result;
    } catch (error) {
      throw errorHandler(error);
    }
  }

  async get (id, params) {
    debug('Requesting get() remote service on path ' + this.path, id, params);
    try {
      const result = await this.requester.send({ type: 'get', path: this.path, id, params });
      debug('Successfully get() remote service on path ' + this.path);
      return result;
    } catch (error) {
      throw errorHandler(error);
    }
  }

  async create (data, params) {
    debug('Requesting create() remote service on path ' + this.path, data, params);
    try {
      const result = await this.requester.send({ type: 'create', path: this.path, data, params });
      debug('Successfully create() remote service on path ' + this.path);
      return result;
    } catch (error) {
      throw errorHandler(error);
    }
  }

  async update (id, data, params) {
    debug('Requesting update() remote service on path ' + this.path, id, data, params);
    try {
      const result = await this.requester.send({ type: 'update', path: this.path, id, data, params });
      debug('Successfully update() remote service on path ' + this.path);
      return result;
    } catch (error) {
      throw errorHandler(error);
    }
  }

  async patch (id, data, params) {
    debug('Requesting patch() remote service on path ' + this.path, id, data, params);
    try {
      const result = await this.requester.send({ type: 'patch', path: this.path, id, data, params });
      debug('Successfully patch() remote service on path ' + this.path);
      return result;
    } catch (error) {
      throw errorHandler(error);
    }
  }

  async remove (id, params) {
    debug('Requesting remove() remote service on path ' + this.path, id, params);
    try {
      const result = await this.requester.send({ type: 'remove', path: this.path, id, params });
      debug('Successfully remove() remote service on path ' + this.path);
      return result;
    } catch (error) {
      throw errorHandler(error);
    }
  }
}

module.exports = RemoteService;
