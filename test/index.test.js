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

describe('Feathers Cassandra service', () => {
  let app;

  before(async () => {
    app = feathers()
      .configure(app => distributed(app)({
        host: 'localhost'
      }));

    app.use('/local', memory({}));

    mock.onGet('http://localhost:80/remote').reply(200, {
      find: true
    });

    mock.onGet('http://localhost:80/remote/1').reply(200, {
      get: true
    });

    mock.onPost('http://localhost:80/remote').reply(201, {
      create: true
    });

    mock.onPut('http://localhost:80/remote/1').reply(200, {
      update: true
    });

    mock.onPatch('http://localhost:80/remote/1').reply(200, {
      patch: true
    });

    mock.onDelete('http://localhost:80/remote/1').reply(200, {
      remove: true
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

    it('remote service', () => {
      const service = app.service('remote');

      expect(service).to.be.ok;
      expect(service.remote).to.equal(true);
      expect(service.path).to.be.ok;
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
});
