| Option | Type | Default | Required | Description |
| --- |--- | --- | --- | --- |
| protocol | string | `'http'` | no | Protocol to use when calling remote services.<br/><br/>Supported protocols are `http` & `https`. |
| host | string | `null` | no | Default hostname to use when calling remote services. |
| port | number | `80` | no | Port number to use when calling remote services.<br/><br/>Defaults to the default port of the selected protocol. |
| dnsSuffix | string | `''` | no | DNS suffix that will be added to the `host` when calling remote services. |
| pathToHost | boolean, function | `false` | no | Convert path to hostname by replacing all non-alphanumeric characters to `-`.<br/><br/>Can be set with a custom method that receives a path and returns a hostname. |
| timeout | number | `0` | no | Request timeout in milliseconds. Set to `0` to disable redirects.<br/><br/>If timeout enabled, it will include the time spent on retries by default. |
| proxy | object | `null` | no | Transparent HTTP proxy that will forward requests to remote services.<br/><br/>Set the `proxy` object with `host` & `port`.<br/><br/>If proxy authentication is required, set the `auth` key with object containing the `username` & `password` keys. |
| excludeParams | string[] | `[]` | no | Keys to exclude from the remote service call's `params` object before sending the request. |
| maxRedirects | number | `5` | no | Max redirects to follow. Set to `0` to disable redirects. |
| keepAlive | boolean | `false` | no | Use HTTP persistent connections with HTTP keep-alive. |
| internalRequestHeader | string | `X-Internal-Request` | no | Name of the request header that is sent with each request to remote service.<br/><br/>This header is used to identify the request as internal and contains the `params` object of the service call. |
