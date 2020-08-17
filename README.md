# feathers-http-distributed

[![Build Status](https://travis-ci.org/dekelev/feathers-http-distributed.svg?branch=master)](https://travis-ci.org/dekelev/feathers-http-distributed)
[![Coverage Status](https://coveralls.io/repos/github/dekelev/feathers-http-distributed/badge.svg?branch=master)](https://coveralls.io/github/dekelev/feathers-http-distributed?branch=master)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/standard/semistandard)
[![Dependency Status](https://img.shields.io/david/dekelev/feathers-http-distributed.svg)](https://david-dm.org/dekelev/feathers-http-distributed)
[![npm](https://img.shields.io/npm/v/feathers-http-distributed.svg?maxAge=3600)](https://www.npmjs.com/package/feathers-http-distributed)

Distribute FeathersJS apps over the network with inter-service communication using HTTP protocol.

### Init

```js
const distributed = require('feathers-http-distributed');
const app = express(feathers());

app.configure(distributed({}));
```

##### Options

| Option | Type | Default | Required | Description |
| --- |:---: | :---: | :---: | --- |
| protocol | string | `'http'` | no | Protocol to use when calling remote services.<br/><br/>Supported protocols are `http` & `https`. |
| host | string | `null` | no | Default hostname to use when calling remote services. |
| port | number | `80` | no | Port number to use when calling remote services.<br/><br/>Defaults to the default port of the selected protocol. |
| dnsSuffix | string | `''` | no | DNS suffix that will be added to the `host` when calling remote services. |
| pathToHost | boolean<br/>function | `false` | no | If `host` is not set, path will be converted into `host` by replacing all the non-alphanumeric characters to `-`.<br/><br/>Can also be set with a custom method that receives a path and returns a `host`. |
| timeout | number | `0` | no | Request timeout in milliseconds.<br/><br/>Set to `0` to disable timeout.<br/><br/>If timeout is enabled, by default, it will include the time spent on retries. |
| proxy | object | `null` | no | Transparent HTTP proxy to forward requests to remote services.<br/><br/>Set the `proxy` object with `host` & `port`.<br/><br/>If proxy authentication is required, set the `auth` key with object containing the `username` & `password` keys. |
| excludeParams | string[] | `null` | no | List of keys to exclude from the `params` object of the remote service call before sending the request. |
| maxRedirects | number | `5` | no | Maximum redirects to follow.<br/><br/>Set to `0` to disable redirects. |
| keepAlive | boolean | `false` | no | Use HTTP persistent connections with HTTP keep-alive. |
| internalRequestHeader | string | `X-Internal-Request` | no | Name of the request header that is sent with each request to remote service.<br/><br/>This header is used to identify the request as internal and contains the `params` object of the service call.<br/><br/>**Add rule in your external API Gateway or load-balancer to remove this header from all incoming requests.** |
| retry | boolean<br/>object | `false` | no | Retry failed requests on a network error or when receiving 5xx error on an idempotent request (GET, HEAD, OPTIONS, PUT or DELETE).<br/><br/>By default, it will retry failed requests 3 times without delay.<br/><br/>List of all the supported retry options is available [here](https://www.npmjs.com/package/axios-retry#options). |

### Call remote service

```js
const result = await app.service('remote').find({});

const result = await app.service('remote').find({ host: 'remote-app' });
```

##### Params

| Option | Type | Required | Description |
| --- | :---: | :---: | --- |
| protocol | string | no | Overrides the `protocol` init option. |
| host | string | no | Overrides the `host` and `pathToHost` init options. |
| port | number | no | Overrides the `port` init option. |
| dnsSuffix | string | no | Overrides the `dnsSuffix` init option. |
| timeout | number | no | Overrides the `timeout` init option. |
| proxy | object | no | Overrides the `proxy` init option. |

### Middleware

Use the `handleInternalRequest` method to handle and detect when an incoming HTTP request originated from a remote FeathersJS app.
  
When `handleInternalRequest` returns `true`, skip any further custom middlewares that should run on an external HTTP request.

```js
const { handleInternalRequest } = require('feathers-http-distributed');

app.use((req, res, next) => {
  if (handleInternalRequest(req)) {
    next();

    return;
  }

  // Add here custom middlewares that only applies to external HTTP requests
});
```

### Security

Secure your network by adding a rule in your external API Gateway or load-balancer to remove the `X-Internal-Request` request header from all the incoming requests.

### Debug logs

Debug logs can be enabled by settings the `DEBUG` environment variable to `feathers-http-distributed*,axios`.

### Debugging in Kubernetes

The `proxy` option can be used to forward requests from a FeathersJS app running locally to remote services inside Kubernetes clusters with the help of transparent HTTP proxies.

Tools like [Telepresence](https://www.telepresence.io/) helps with debugging incoming traffic that goes into Kubernetes pods, by swapping the pods with proxy pods and redirects incoming traffic to a local port on the host.

With the `proxy` option set, you can simply run [Telepresence](https://www.telepresence.io/) with the [`inject-tcp` proxying method](https://www.telepresence.io/reference/methods.html) and debug your FeathersJS app as you normally do.

See [here](https://github.com/dekelev/kong-transparent-proxy) for example of deploying transparent HTTP proxy with Docker.
