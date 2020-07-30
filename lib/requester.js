const axios = require('axios');

const PROTOCOL = 'http';
const HOST = 'localhost';
const PORT = 6060;
const HTTP_METHODS = {
  find: 'get',
  get: 'get',
  create: 'post',
  update: 'put',
  patch: 'patch',
  remove: 'delete'
};

const idToString = function (id) {
  if (typeof id === 'object') { return JSON.stringify(id); }

  return id;
};

const send = async function (options) {
  const { type, path, id, data, params = {} } = options;
  const httpMethod = HTTP_METHODS[type];
  const fullPath = id ? `${path}/${idToString(id)}` : path;
  const url = `${PROTOCOL}://${HOST}:${PORT}/${fullPath}`;
  const requestOptions = {
    headers: {
      'Content-Type': 'application/json',
      'x-feathers-internal': JSON.stringify(params)
    }
  };
  const args = data ? [url, data, requestOptions] : [url, requestOptions];

  const result = await axios[httpMethod](...args);

  return result.data;
};

module.exports = {
  send
};
