| Option | Type | Default | Required | Description |
| --- |--- | --- | --- | --- |
| protocol | string | `'http'` | no | Protocol to use when calling remote services.<br/><br/>Supported protocols are `http` & `https`. |
| host | string | `null` | no | Default hostname to use when calling remote services. |
| port | number | `80` | no | Port number to use when calling remote services.<br/><br/>Defaults to the default port of the selected protocol. |
| dnsSuffix | string | `''` | no | DNS suffix that will be added to the `host` when calling remote services. |
| pathToHost | boolean<br/>function | `false` | no | Convert path to hostname by replacing all non-alphanumeric characters to `-`.<br/><br/>Can also be set with a custom method that receives a path and returns a hostname. |
| timeout | number | `0` | no | Request timeout in milliseconds.<br/><br/>Set to `0` to disable timeout.<br/><br/>If timeout is enabled, by default, it will include the time spent on retries. |
| proxy | object | `null` | no | Transparent HTTP proxy to forward requests to remote services.<br/><br/>Set the `proxy` object with `host` & `port`.<br/><br/>If proxy authentication is required, set the `auth` key with object containing the `username` & `password` keys. |
| excludeParams | string[] | `[]` | no | Keys to exclude from the `params` object of the remote service call before sending the request. |
| maxRedirects | number | `5` | no | Maximum redirects to follow.<br/><br/>Set to `0` to disable redirects. |
| keepAlive | boolean | `false` | no | Use HTTP persistent connections with HTTP keep-alive. |
| internalRequestHeader | string | `X-Internal-Request` | no | Name of the request header that is sent with each request to remote service.<br/><br/>This header is used to identify the request as internal and contains the `params` object of the service call. |
| retry | boolean<br/>object | `null` | no | Retry failed requests on a network error or when receiving 5xx error on an idempotent request (GET, HEAD, OPTIONS, PUT or DELETE).<br/><br/>By default, it will retry failed requests 3 times without delay.<br/><br/>List of all the supported retry options is available [here](https://www.npmjs.com/package/axios-retry#options). |
