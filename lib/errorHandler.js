const { convert } = require('@feathersjs/errors');

const errorHandler = function (error) {
  return convert(error.response ? error.response.data : error);
};

module.exports = errorHandler;
