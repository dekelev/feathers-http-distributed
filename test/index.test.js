/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const assert = require('assert');
const feathers = require('@feathersjs/feathers');
const memory = require('feathers-memory');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const mock = new MockAdapter(axios);
const distributed = require('../lib');
const {
  handleInternalRequest,
  stripSlashes,
  pathToHost,
  idToString
} = require('../lib/utils');
const {
  DEFAULT_PROTOCOL,
  DEFAULT_PORT,
  DEFAULT_TIMEOUT,
  SERVICE_PROTOCOL_HEADER,
  SERVICE_HOST_HEADER,
  SERVICE_PORT_HEADER,
  INTERNAL_REQUEST_HEADER
} = require('../lib/constants');

const DEFAULT_HOST = 'localhost';

describe('Feathers Cassandra service', () => {
  let app;

  before(async () => {
    app = feathers()
      .configure(app => distributed(app)({
        host: DEFAULT_HOST
      }));

    app.use('/local', memory({}));

    mock.onGet('http://localhost:80/remote').reply(function (config) {
      return [
        200,
        {
          find: true,
          config
        }
      ];
    });

    mock.onGet('http://localhost:80/remote/1').reply(function (config) {
      return [
        200,
        {
          get: true,
          config
        }
      ];
    });

    mock.onGet('http://localhost:80/remote/timeout').reply(function (config) {
      return [
        200,
        {
          config
        }
      ];
    });

    mock.onPost('http://localhost:80/remote').reply(function (config) {
      return [
        201,
        {
          create: true,
          config
        }
      ];
    });

    mock.onPut('http://localhost:80/remote/1').reply(function (config) {
      return [
        200,
        {
          update: true,
          config
        }
      ];
    });

    mock.onPatch('http://localhost:80/remote/1').reply(function (config) {
      return [
        200,
        {
          patch: true,
          config
        }
      ];
    });

    mock.onDelete('http://localhost:80/remote/1').reply(function (config) {
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

    describe('Request headers', () => {
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

      it('sends X-Service request headers', async () => {
        const service = app.service('remote');

        const res = await service.find({});

        expect(res).to.be.ok;
        expect(res.config.headers[SERVICE_PROTOCOL_HEADER]).to.equal(DEFAULT_PROTOCOL);
        expect(res.config.headers[SERVICE_HOST_HEADER]).to.equal(DEFAULT_HOST);
        expect(res.config.headers[SERVICE_PORT_HEADER]).to.equal(DEFAULT_PORT);
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

    describe('Request timeout', () => {
      it('default timeout', async () => {
        const service = app.service('remote');

        const res = await service.get(1);

        expect(res).to.be.ok;
        expect(res.config.timeout).to.equal(DEFAULT_TIMEOUT);
      });

      it('timeout param', async () => {
        const service = app.service('remote');

        const res = await service.get(1, { timeout: 2000 });

        expect(res).to.be.ok;
        expect(res.config.timeout).to.equal(2000);
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

          const fromRemote = handleInternalRequest(res.config);

          expect(fromRemote).to.equal(true);
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

      describe('stripSlashes', () => {
        it('without leading or trailing slashes', async () => {
          const path = 'test';

          const res = stripSlashes(path);

          expect(res).to.equal(path);
        });

        it('with leading slashes', async () => {
          const path = '//test';

          const res = stripSlashes(path);

          expect(res).to.equal('test');
        });

        it('with trailing slashes', async () => {
          const path = 'test//';

          const res = stripSlashes(path);

          expect(res).to.equal('test');
        });

        it('leading and with trailing slashes', async () => {
          const path = '//test//';

          const res = stripSlashes(path);

          expect(res).to.equal('test');
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
    });
  });
});
