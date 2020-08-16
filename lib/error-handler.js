const errors = require('@feathersjs/errors');
const { convert } = require('@feathersjs/errors');

const errorHandler = function (error) {
  const err = error.response ? error.response.data || error.response : error;
  let feathersError;

  if (error.response) {
    if (err.status === 404) {
      feathersError = new errors.NotFound(err);
    }
  } else if (err.code) {
    if (err.code === 'ECONNABORTED') {
      feathersError = new errors.FeathersError(err, 'GatewayTimeout', 504, 'gateway-timeout');
    }
  } else {
    feathersError = new errors.BadGateway(err);
  }

  if (!feathersError) {
    feathersError = convert(err);
  }

  delete feathersError.isAxiosError;
  delete feathersError.config;

  return feathersError;
};

module.exports = errorHandler;
