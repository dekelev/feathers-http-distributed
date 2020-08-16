/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const assert = require('assert');
const feathers = require('@feathersjs/feathers');
const errors = require('@feathersjs/errors');
const memory = require('feathers-memory');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const mock = new MockAdapter(axios);
const distributed = require('../lib');
const {
  handleInternalRequest,
  pathToHost,
  idToString,
  getProtocolPort
} = require('../lib/utils');
const {
  DEFAULT_PROTOCOL,
  DEFAULT_TIMEOUT,
  INTERNAL_REQUEST_HEADER
} = require('../lib/constants');

const DEFAULT_HOST = 'localhost';
const OPTIONS = {
  host: DEFAULT_HOST
};

describe('Feathers Cassandra service', () => {
  let app;

  before(async () => {
    app = feathers()
      .configure(app => distributed(app)(OPTIONS));

    app.use('/local', memory({}));

    const path = 'remote';
    const id = 1;

    mock.onGet(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}/${path}`).reply(function (config) {
      return [
        200,
        {
          find: true,
          config
        }
      ];
    });

    mock.onGet(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}/${path}/${id}`).reply(function (config) {
      return [
        200,
        {
          get: true,
          config
        }
      ];
    });

    mock.onPost(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}/${path}`).reply(function (config) {
      return [
        201,
        {
          create: true,
          config
        }
      ];
    });

    mock.onPut(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}/${path}/${id}`).reply(function (config) {
      return [
        200,
        {
          update: true,
          config
        }
      ];
    });

    mock.onPatch(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}/${path}/${id}`).reply(function (config) {
      return [
        200,
        {
          patch: true,
          config
        }
      ];
    });

    mock.onDelete(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}/${path}/${id}`).reply(function (config) {
      return [
        200,
        {
          remove: true,
          config
        }
      ];
    });
  });

  describe('Initialization', () => {
    it('is CommonJS compatible', () =>
      assert.strictEqual(typeof require('../lib'), 'function'));

    it('without options', () => {
      const app = feathers()
        .configure(app => distributed(app)());

      expect(app).to.be.ok;
    });
  });

  describe('Get service', () => {
    it('local service', () => {
      const service = app.service('local');

      expect(service).to.be.ok;
      expect(service.remote).to.be.undefined;
    });

    it('remote service first use', () => {
      let srv = app.services.remote;
      expect(srv).to.be.undefined;

      const service = app.service('remote');

      srv = app.services.remote;
      expect(srv).to.be.ok;

      expect(service).to.be.ok;
      expect(service.remote).to.equal(true);
      expect(service.path).to.be.ok;
      expect(service.path).to.equal('remote');
    });

    it('remote service after first use', () => {
      const srv = app.services.remote;
      expect(srv).to.be.ok;

      const service = app.service('remote');

      expect(service).to.be.ok;
      expect(service.remote).to.equal(true);
      expect(service.path).to.be.ok;
      expect(service.path).to.equal('remote');
    });

    it('remote service with leading & trailing slashes', () => {
      const service = app.service('/remote/');

      expect(service).to.be.ok;
      expect(service.remote).to.equal(true);
      expect(service.path).to.be.ok;
      expect(service.path).to.equal('remote');
    });
  });

  describe('Call remote service', () => {
    it('find', async () => {
      const service = app.service('remote');

      const res = await service.find({});

      expect(res).to.be.ok;
      expect(res.find).to.equal(true);
    });

    it('get', async () => {
      const service = app.service('remote');

      const res = await service.get(1);

      expect(res).to.be.ok;
      expect(res.get).to.equal(true);
    });

    it('create', async () => {
      const service = app.service('remote');

      const res = await service.create({});

      expect(res).to.be.ok;
      expect(res.create).to.equal(true);
    });

    it('update', async () => {
      const service = app.service('remote');

      const res = await service.update(1, {});

      expect(res).to.be.ok;
      expect(res.update).to.equal(true);
    });

    it('patch', async () => {
      const service = app.service('remote');

      const res = await service.patch(1, {});

      expect(res).to.be.ok;
      expect(res.patch).to.equal(true);
    });

    it('remove', async () => {
      const service = app.service('remote');

      const res = await service.remove(1);

      expect(res).to.be.ok;
      expect(res.remove).to.equal(true);
    });
  });

  describe('Request', () => {
    describe('headers', () => {
      it('sends JSON Content-Type request header', async () => {
        const service = app.service('remote');

        const res = await service.find({});

        expect(res).to.be.ok;
        expect(res.config.headers['Content-Type']).to.equal('application/json');
      });

      it('sends internal request header', async () => {
        const service = app.service('remote');

        const res = await service.find({ test: true });

        expect(res).to.be.ok;
        expect(JSON.parse(res.config.headers[INTERNAL_REQUEST_HEADER]).test).to.equal(true);
      });

      it('sends custom internal request header', async () => {
        const internalRequestHeader = 'custom';
        const app = feathers()
          .configure(app => distributed(app)({
            ...OPTIONS,
            internalRequestHeader
          }));

        const service = app.service('remote');

        const res = await service.find({ test: true });

        expect(res).to.be.ok;
        expect(JSON.parse(res.config.headers[internalRequestHeader]).test).to.equal(true);
      });

      it('sends custom request header', async () => {
        const service = app.service('remote');

        const res = await service.find({
          headers: {
            test: 'true'
          }
        });

        expect(res).to.be.ok;
        expect(res.config.headers.test).to.equal('true');
      });
    });

    describe('params', () => {
      it('without params', async () => {
        const service = app.service('remote');

        const res = await service.find();

        expect(res).to.be.ok;
        expect(res.config.headers[INTERNAL_REQUEST_HEADER]).to.equal('{}');
      });

      it('with params', async () => {
        const service = app.service('remote');

        const res = await service.find({ a: 1, b: 2 });

        expect(res).to.be.ok;
        expect(JSON.parse(res.config.headers[INTERNAL_REQUEST_HEADER]).a).to.equal(1);
        expect(JSON.parse(res.config.headers[INTERNAL_REQUEST_HEADER]).b).to.equal(2);
      });

      it('with excluded param', async () => {
        const app = feathers()
          .configure(app => distributed(app)({
            ...OPTIONS,
            excludeParams: [
              'excluded'
            ]
          }));

        const service = app.service('remote');

        const res = await service.find({ excluded: true, a: 1, b: 2 });

        expect(res).to.be.ok;
        expect(JSON.parse(res.config.headers[INTERNAL_REQUEST_HEADER]).excluded).to.be.undefined;
        expect(JSON.parse(res.config.headers[INTERNAL_REQUEST_HEADER]).a).to.equal(1);
        expect(JSON.parse(res.config.headers[INTERNAL_REQUEST_HEADER]).b).to.equal(2);
      });

      it('protocol, host, dnsSuffix & port params', async () => {
        const protocol = 'https';
        const host = 'remote';
        const dnsSuffix = '-service.local';
        const port = 8443;
        const path = 'remote';

        mock.onGet(`${protocol}://${host}${dnsSuffix}:${port}/${path}`).reply(function (config) {
          return [
            200,
            {
              overrideUrl: true,
              config
            }
          ];
        });

        const service = app.service(path);
        const params = {
          protocol,
          host,
          dnsSuffix,
          port
        };

        const res = await service.find(params);

        expect(res).to.be.ok;
        expect(res.overrideUrl).to.equal(true);
      });
    });

    describe('protocol', () => {
      it('with custom protocol', async () => {
        const protocol = 'https';

        mock.onGet(`${protocol}://${DEFAULT_HOST}/remote`).reply(function (config) {
          return [
            200,
            {
              protocol: true,
              config
            }
          ];
        });

        const app = feathers()
          .configure(app => distributed(app)({
            ...OPTIONS,
            protocol
          }));

        const service = app.service('remote');

        const res = await service.find({});

        expect(res).to.be.ok;
        expect(res.protocol).to.equal(true);
      });
    });

    describe('host', () => {
      it('with default host', async () => {
        const host = 'localhost';

        mock.onGet(`${DEFAULT_PROTOCOL}://${host}/remote`).reply(function (config) {
          return [
            200,
            {
              host: true,
              config
            }
          ];
        });

        const app = feathers()
          .configure(app => distributed(app)({
            ...OPTIONS,
            host
          }));

        const service = app.service('remote');

        const res = await service.find({});

        expect(res).to.be.ok;
        expect(res.host).to.equal(true);
      });

      it('with pathToHost', async () => {
        const path = 'v1-test/service';
        const host = 'v1-test-service';

        mock.onGet(`${DEFAULT_PROTOCOL}://${host}/${path}`).reply(function (config) {
          return [
            200,
            {
              pathToHost: true,
              config
            }
          ];
        });

        const app = feathers()
          .configure(app => distributed(app)({
            pathToHost: true
          }));

        const service = app.service(path);

        const res = await service.find({});

        expect(res).to.be.ok;
        expect(res.pathToHost).to.equal(true);
      });

      it('with custom pathToHost', async () => {
        const path = 'v1-test/service';
        const host = 'v1_test_service';

        mock.onGet(`${DEFAULT_PROTOCOL}://${host}/${path}`).reply(function (config) {
          return [
            200,
            {
              pathToHost: 'custom',
              config
            }
          ];
        });

        const app = feathers()
          .configure(app => distributed(app)({
            pathToHost: path => path.replace(/[^a-z0-9]/gi, '_')
          }));

        const service = app.service(path);

        const res = await service.find({});

        expect(res).to.be.ok;
        expect(res.pathToHost).to.equal('custom');
      });

      it('with DNS suffix', async () => {
        const dnsSuffix = '-svc.local';

        mock.onGet(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}${dnsSuffix}/remote`).reply(function (config) {
          return [
            200,
            {
              dnsSuffix: true,
              config
            }
          ];
        });

        const app = feathers()
          .configure(app => distributed(app)({
            ...OPTIONS,
            dnsSuffix
          }));

        const service = app.service('remote');

        const res = await service.find({});

        expect(res).to.be.ok;
        expect(res.dnsSuffix).to.equal(true);
      });

      it('with DNS suffix option & param', async () => {
        const dnsSuffixOption = '-svc.local';
        const dnsSuffixParam = '.local';

        mock.onGet(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}${dnsSuffixParam}/remote`).reply(function (config) {
          return [
            200,
            {
              dnsSuffix: true,
              config
            }
          ];
        });

        const app = feathers()
          .configure(app => distributed(app)({
            ...OPTIONS,
            dnsSuffix: dnsSuffixOption
          }));

        const service = app.service('remote');

        const res = await service.find({
          dnsSuffix: dnsSuffixParam
        });

        expect(res).to.be.ok;
        expect(res.dnsSuffix).to.equal(true);
      });
    });

    describe('port', () => {
      it('with custom port', async () => {
        const port = 8000;

        mock.onGet(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}:${port}/remote`).reply(function (config) {
          return [
            200,
            {
              port: true,
              config
            }
          ];
        });

        const app = feathers()
          .configure(app => distributed(app)({
            ...OPTIONS,
            port
          }));

        const service = app.service('remote');

        const res = await service.find({});

        expect(res).to.be.ok;
        expect(res.port).to.equal(true);
      });
    });

    describe('proxy', () => {
      it('request with proxy host', async () => {
        const host = 'app';
        const path = 'remote-proxy';
        const proxy = {
          host: 'localhost'
        };

        mock.onGet(`${DEFAULT_PROTOCOL}://${host}/${path}`).reply(function (config) {
          return [
            200,
            {
              proxy: true,
              config
            }
          ];
        });

        const app = feathers()
          .configure(app => distributed(app)({
            ...OPTIONS,
            proxy
          }));

        const service = app.service(path);

        const res = await service.find({ host });

        expect(res).to.be.ok;
        expect(res.proxy).to.equal(true);
        expect(res.config.proxy.host).to.equal(proxy.host);
      });

      it('request with proxy host & port', async () => {
        const host = 'app';
        const path = 'remote-proxy-with-port';
        const proxy = {
          host: 'localhost',
          port: 8000
        };

        mock.onGet(`${DEFAULT_PROTOCOL}://${host}/${path}`).reply(function (config) {
          return [
            200,
            {
              proxyWithPort: true,
              config
            }
          ];
        });

        const app = feathers()
          .configure(app => distributed(app)({
            ...OPTIONS,
            proxy
          }));

        const service = app.service(path);

        const res = await service.find({ host });

        expect(res).to.be.ok;
        expect(res.proxyWithPort).to.equal(true);
        expect(res.config.proxy.host).to.equal(proxy.host);
        expect(res.config.proxy.port).to.equal(proxy.port);
      });
    });

    describe('timeout', () => {
      it('default timeout', async () => {
        const service = app.service('remote');

        const res = await service.get(1);

        expect(res).to.be.ok;
        expect(res.config.timeout).to.equal(DEFAULT_TIMEOUT);
      });

      it('timeout option', async () => {
        const timeout = 1000;

        const app = feathers()
          .configure(app => distributed(app)({
            ...OPTIONS,
            timeout
          }));

        const service = app.service('remote');

        const res = await service.find({});

        expect(res).to.be.ok;
        expect(res.config.timeout).to.equal(timeout);
      });

      it('timeout param', async () => {
        const service = app.service('remote');

        const res = await service.get(1, { timeout: 2000 });

        expect(res).to.be.ok;
        expect(res.config.timeout).to.equal(2000);
      });

      it('timeout option & param', async () => {
        const timeoutOption = 1000;
        const timeoutParam = 2000;

        const app = feathers()
          .configure(app => distributed(app)({
            ...OPTIONS,
            timeout: timeoutOption
          }));

        const service = app.service('remote');

        const res = await service.find({ timeout: timeoutParam });

        expect(res).to.be.ok;
        expect(res.config.timeout).to.equal(timeoutParam);
      });
    });

    describe('maxRedirect', () => {
      it('set no redirects', async () => {
        const maxRedirects = 0;

        const app = feathers()
          .configure(app => distributed(app)({
            ...OPTIONS,
            maxRedirects
          }));

        const service = app.service('remote');

        const res = await service.get(1);

        expect(res).to.be.ok;
        expect(res.config.maxRedirects).to.equal(maxRedirects);
      });

      it('set max 1 redirect', async () => {
        const maxRedirects = 1;

        const app = feathers()
          .configure(app => distributed(app)({
            ...OPTIONS,
            maxRedirects
          }));

        const service = app.service('remote');

        const res = await service.get(1);

        expect(res).to.be.ok;
        expect(res.config.maxRedirects).to.equal(maxRedirects);
      });
    });

    describe('keepAlive', () => {
      it('without keep-alive', async () => {
        const keepAlive = false;

        const app = feathers()
          .configure(app => distributed(app)({
            ...OPTIONS,
            keepAlive
          }));

        const service = app.service('remote');

        const res = await service.get(1);

        expect(res).to.be.ok;
        expect(res.config.httpAgent).to.be.undefined;
        expect(res.config.httpsAgent).to.be.undefined;
      });

      it('with keep-alive', async () => {
        const keepAlive = true;

        const app = feathers()
          .configure(app => distributed(app)({
            ...OPTIONS,
            keepAlive
          }));

        const service = app.service('remote');

        const res = await service.get(1);

        expect(res).to.be.ok;
        expect(res.config.httpAgent).to.be.ok;
        expect(res.config.httpsAgent).to.be.ok;
        expect(res.config.httpAgent.keepAlive).to.equal(true);
        expect(res.config.httpsAgent.keepAlive).to.equal(true);
      });
    });

    describe('retry', () => {
      it('retry on network error', async () => {
        const retry = true;
        const path = 'retry-network-error';

        mock.onGet(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}/${path}`).networkError();

        const app = feathers()
          .configure(app => distributed(app)({
            ...OPTIONS,
            retry
          }));

        const service = app.service(path);

        await service.find({}).then(() => {
          throw new Error('Should never get here');
        }).catch(function (error) {
          expect(error).to.be.ok;
          expect(error instanceof errors.BadGateway).to.be.ok;
        });
      });

      it('retry on timeout error', async () => {
        const retry = true;
        const path = 'retry-timeout-error';
        const errCode = 504;

        mock.onGet(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}/${path}`).timeout();

        const app = feathers()
          .configure(app => distributed(app)({
            ...OPTIONS,
            retry
          }));

        const service = app.service(path);

        await service.find({}).then(() => {
          throw new Error('Should never get here');
        }).catch(function (error) {
          expect(error).to.be.ok;
          expect(error.code).to.equal(errCode);
        });
      });

      it('retry on server error', async () => {
        const retry = true;
        const path = 'retry-server-error';
        const errCode = 500;

        mock.onGet(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}/${path}`).reply(function (config) {
          return [
            errCode,
            new errors.GeneralError()
          ];
        });

        const app = feathers()
          .configure(app => distributed(app)({
            ...OPTIONS,
            retry
          }));

        const service = app.service(path);

        await service.find({}).then(() => {
          throw new Error('Should never get here');
        }).catch(function (error) {
          expect(error).to.be.ok;
          expect(error.code).to.equal(errCode);
        });
      });
    });
  });

  describe('Error handler', () => {
    it('invalid protocol error', async () => {
      const errMsg = 'Invalid protocol a';
      const path = 'invalid-protocol-error';

      const app = feathers()
        .configure(app => distributed(app)({
          ...OPTIONS,
          protocol: 'a'
        }));

      const service = app.service(path);

      await service.find({}).then(() => {
        throw new Error('Should never get here');
      }).catch(function (error) {
        expect(error).to.be.ok;
        expect(error instanceof errors.BadRequest).to.be.ok;
        expect(error.message).to.equal(errMsg);
      });
    });

    it('missing host error', async () => {
      const errMsg = 'Missing host';
      const path = 'missing-host-error';

      const app = feathers()
        .configure(app => distributed(app)());

      const service = app.service(path);

      await service.find({}).then(() => {
        throw new Error('Should never get here');
      }).catch(function (error) {
        expect(error).to.be.ok;
        expect(error instanceof errors.BadRequest).to.be.ok;
        expect(error.message).to.equal(errMsg);
      });
    });

    it('invalid port error', async () => {
      const errMsg = 'Invalid port 70000';
      const path = 'invalid-port-error';

      const app = feathers()
        .configure(app => distributed(app)({
          ...OPTIONS,
          port: 70000
        }));

      const service = app.service(path);

      await service.find({}).then(() => {
        throw new Error('Should never get here');
      }).catch(function (error) {
        expect(error).to.be.ok;
        expect(error instanceof errors.BadRequest).to.be.ok;
        expect(error.message).to.equal(errMsg);
      });
    });

    it('network error', async () => {
      const errMsg = 'Network Error';
      const path = 'remote-error';

      mock.onGet(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}/${path}`).networkError();

      const service = app.service(path);

      await service.find({}).then(() => {
        throw new Error('Should never get here');
      }).catch(function (error) {
        expect(error).to.be.ok;
        expect(error instanceof errors.BadGateway).to.be.ok;
        expect(error.message).to.equal(errMsg);
      });
    });

    it('timeout error', async () => {
      const errName = 'GatewayTimeout';
      const errCode = 504;
      const errMsg = 'timeout of 0ms exceeded';
      const path = 'remote-timeout-error';

      mock.onGet(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}/${path}`).timeout();

      const service = app.service(path);

      await service.find({}).then(() => {
        throw new Error('Should never get here');
      }).catch(function (error) {
        expect(error).to.be.ok;
        expect(error.name).to.equal(errName);
        expect(error.code).to.equal(errCode);
        expect(error.message).to.equal(errMsg);
      });
    });

    it('not-found error', async () => {
      const errCode = 404;
      const errMsg = 'Error';
      const path = 'remote-not-found-error';

      const service = app.service(path);

      await service.find({}).then(() => {
        throw new Error('Should never get here');
      }).catch(function (error) {
        expect(error).to.be.ok;
        expect(error instanceof errors.NotFound).to.be.ok;
        expect(error.code).to.equal(errCode);
        expect(error.message).to.equal(errMsg);
      });
    });

    it('not-found (mock) error', async () => {
      const errCode = 404;
      const path = 'remote-not-found-error';

      mock.onGet(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}/${path}`).reply(function (config) {
        return [
          errCode,
          new errors.NotFound()
        ];
      });

      const service = app.service(path);

      await service.find({}).then(() => {
        throw new Error('Should never get here');
      }).catch(function (error) {
        expect(error).to.be.ok;
        expect(error instanceof errors.NotFound).to.be.ok;
        expect(error.code).to.equal(errCode);
      });
    });

    it('client error', async () => {
      const errCode = 400;
      const errMsg = 'client error';
      const path = 'remote-client-error';

      mock.onGet(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}/${path}`).reply(function (config) {
        return [
          errCode,
          new errors.BadRequest(errMsg)
        ];
      });

      const service = app.service(path);

      await service.find({}).then(() => {
        throw new Error('Should never get here');
      }).catch(function (error) {
        expect(error).to.be.ok;
        expect(error instanceof errors.BadRequest).to.be.ok;
        expect(error.code).to.equal(errCode);
        expect(error.message).to.equal(errMsg);
      });
    });

    it('server error', async () => {
      const errCode = 500;
      const errMsg = 'server error';
      const path = 'remote-server-error';

      mock.onGet(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}/${path}`).reply(function (config) {
        return [
          errCode,
          new errors.GeneralError(errMsg)
        ];
      });

      const service = app.service(path);

      await service.find({}).then(() => {
        throw new Error('Should never get here');
      }).catch(function (error) {
        expect(error).to.be.ok;
        expect(error instanceof errors.GeneralError).to.be.ok;
        expect(error.code).to.equal(errCode);
        expect(error.message).to.equal(errMsg);
      });
    });

    describe('service methods', () => {
      it('find', async () => {
        const errCode = 500;
        const errMsg = 'server find error';
        const path = 'remote-server-find-error';

        mock.onGet(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}/${path}`).reply(function (config) {
          return [
            errCode,
            new errors.GeneralError(errMsg)
          ];
        });

        const service = app.service(path);

        await service.find({}).then(() => {
          throw new Error('Should never get here');
        }).catch(function (error) {
          expect(error).to.be.ok;
          expect(error instanceof errors.GeneralError).to.be.ok;
          expect(error.code).to.equal(errCode);
          expect(error.message).to.equal(errMsg);
        });
      });

      it('get', async () => {
        const errCode = 500;
        const errMsg = 'server get error';
        const path = 'remote-server-get-error';
        const id = 1;

        mock.onGet(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}/${path}/${id}`).reply(function (config) {
          return [
            errCode,
            new errors.GeneralError(errMsg)
          ];
        });

        const service = app.service(path);

        await service.get(id).then(() => {
          throw new Error('Should never get here');
        }).catch(function (error) {
          expect(error).to.be.ok;
          expect(error instanceof errors.GeneralError).to.be.ok;
          expect(error.code).to.equal(errCode);
          expect(error.message).to.equal(errMsg);
        });
      });

      it('create', async () => {
        const errCode = 500;
        const errMsg = 'server create error';
        const path = 'remote-server-create-error';

        mock.onPost(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}/${path}`).reply(function (config) {
          return [
            errCode,
            new errors.GeneralError(errMsg)
          ];
        });

        const service = app.service(path);

        await service.create({}).then(() => {
          throw new Error('Should never get here');
        }).catch(function (error) {
          expect(error).to.be.ok;
          expect(error instanceof errors.GeneralError).to.be.ok;
          expect(error.code).to.equal(errCode);
          expect(error.message).to.equal(errMsg);
        });
      });

      it('update', async () => {
        const errCode = 500;
        const errMsg = 'server update error';
        const path = 'remote-server-update-error';
        const id = 1;

        mock.onPut(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}/${path}/${id}`).reply(function (config) {
          return [
            errCode,
            new errors.GeneralError(errMsg)
          ];
        });

        const service = app.service(path);

        await service.update(id, {}).then(() => {
          throw new Error('Should never get here');
        }).catch(function (error) {
          expect(error).to.be.ok;
          expect(error instanceof errors.GeneralError).to.be.ok;
          expect(error.code).to.equal(errCode);
          expect(error.message).to.equal(errMsg);
        });
      });

      it('patch', async () => {
        const errCode = 500;
        const errMsg = 'server patch error';
        const path = 'remote-server-patch-error';
        const id = 1;

        mock.onPatch(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}/${path}/${id}`).reply(function (config) {
          return [
            errCode,
            new errors.GeneralError(errMsg)
          ];
        });

        const service = app.service(path);

        await service.patch(id, {}).then(() => {
          throw new Error('Should never get here');
        }).catch(function (error) {
          expect(error).to.be.ok;
          expect(error instanceof errors.GeneralError).to.be.ok;
          expect(error.code).to.equal(errCode);
          expect(error.message).to.equal(errMsg);
        });
      });

      it('remove', async () => {
        const errCode = 500;
        const errMsg = 'server remove error';
        const path = 'remote-server-remove-error';
        const id = 1;

        mock.onDelete(`${DEFAULT_PROTOCOL}://${DEFAULT_HOST}/${path}/${id}`).reply(function (config) {
          return [
            errCode,
            new errors.GeneralError(errMsg)
          ];
        });

        const service = app.service(path);

        await service.remove(id).then(() => {
          throw new Error('Should never get here');
        }).catch(function (error) {
          expect(error).to.be.ok;
          expect(error instanceof errors.GeneralError).to.be.ok;
          expect(error.code).to.equal(errCode);
          expect(error.message).to.equal(errMsg);
        });
      });
    });
  });

  describe('Utils', () => {
    describe('handleInternalRequest', () => {
      it('ignore external call', async () => {
        const req = {
          headers: [],
          feathers: {
            provider: 'rest',
            headers: []
          }
        };

        const fromRemote = handleInternalRequest(req);

        expect(fromRemote).to.equal(false);
      });

      it('internal call from remote service', async () => {
        const service = app.service('remote');

        const res = await service.find({ a: 1, b: 2 });

        res.config.feathers = {
          provider: 'rest',
          headers: []
        };

        res.config.headers[INTERNAL_REQUEST_HEADER.toLowerCase()] = res.config.headers[INTERNAL_REQUEST_HEADER];

        const handleRes = handleInternalRequest(res.config);

        expect(handleRes).to.equal(true);
        expect(res.config.feathers.fromRemote).to.equal(true);
        expect(res.config.feathers.a).to.equal(1);
        expect(res.config.feathers.b).to.equal(2);
        expect(res.config.feathers.provider).to.be.undefined;
        expect(res.config.feathers.headers).to.be.undefined;
      });

      it('custom internal request header name', async () => {
        const headerName = 'custom';
        const service = app.service('remote');

        const res = await service.get(1);

        res.config.feathers = {
          provider: 'rest',
          headers: []
        };

        res.config.headers[headerName] = res.config.headers[INTERNAL_REQUEST_HEADER];

        const fromRemote = handleInternalRequest(res.config, { internalRequestHeader: headerName });

        expect(fromRemote).to.equal(true);
      });
    });

    describe('pathToHost', () => {
      it('alphanumeric chars', async () => {
        const path = 'v1-test';

        const res = pathToHost(path);

        expect(res).to.equal(path);
      });

      it('alphanumeric and dash chars', async () => {
        const path = 'v1-test-path';

        const res = pathToHost(path);

        expect(res).to.equal(path);
      });

      it('alphanumeric, dash and slashes chars', async () => {
        const path = 'v1-test-path/to/host';

        const res = pathToHost(path);

        expect(res).to.equal('v1-test-path-to-host');
      });
    });

    describe('idToString', () => {
      it('integer id', async () => {
        const id = 1;

        const res = idToString(id);

        expect(res).to.equal(id);
      });

      it('string id', async () => {
        const id = 'test';

        const res = idToString(id);

        expect(res).to.equal(id);
      });

      it('array id', async () => {
        const id = ['test'];

        const res = idToString(id);

        expect(res).to.equal('["test"]');
      });

      it('object id', async () => {
        const id = { test: true };

        const res = idToString(id);

        expect(res).to.equal('{"test":true}');
      });
    });

    describe('getProtocolPort', () => {
      it('http', async () => {
        const res = getProtocolPort('http');

        expect(res).to.equal(80);
      });

      it('https', async () => {
        const res = getProtocolPort('https');

        expect(res).to.equal(443);
      });
    });
  });
});
