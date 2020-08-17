| Option | Type | Default | Required | Description |
| --- |--- | --- | --- | --- |
| protocol | string | `'http'` | no | Protocol to use when calling remote services. supported protocols are http & https. |
| host | string | `null` | no | Default hostname to use when calling remote services. not set by default. |
| port | number | `80` | no | Port number to use when calling remote services. defaults to the selected HTTP protocol's default port. |
| dnsSuffix | string | `''` | no | DNS suffix that will be added to the `host` when calling remote services. |
| pathToHost | boolean, function | `false` | no | Convert path to hostname by replacing all non-alphanumeric characters to `-`. can also be set with a custom method that receives path and returns hostname. |
| timeout | number | `0` | no | Request timeout in milliseconds |
| proxy | object | `null` | no | Transparent HTTP proxy to forward requests to remote services. |
| excludeParams | string[] | `[]` | no | Keys to exclude from the remote service call's `params` object before sending the request. |
| maxRedirects | number | `5` | no | Max redirects to follow. set to `0` to disable redirects. |
| keepAlive | boolean | `false` | no | Use HTTP persistent connections with HTTP keep-alive. |
| internalRequestHeader | string | `X-Internal-Request` | no | Name of the request header that is sent with each request to remote service.<br/><br/>This header is used to identify the request as internal and contains the `params` object of the service call. |
