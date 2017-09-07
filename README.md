# cri-request-interception

# Example

When attempting to run the code from
[Intercept-and-block-requests-by-URL](https://github.com/cyrus-and/chrome-remote-interface/wiki/Intercept-and-block-requests-by-URL)
the first time chrome is started with a new user-data-dir
`Network.requestIntercepted` doesn't intercept requests. If Chrome is stopped
and started again with the same user-data-dir it works as expected. This only
happens when not using the `--headless` flag. When used in conjunction with
chrome-launcher it seems as though the code doesn't work since chrome-launcher
creates a new user-data-dir every time.

When the following code is executed.

``` javascript
const chromeLauncher = require('chrome-launcher');
const CDP            = require('chrome-remote-interface');
const url            = require('url');

function shallNotPass(request) {
  const {pathname} = url.parse(request.url);
  return pathname.match(/\.(css|png|svg)$/);
}

async function example() {
  const chromeInstance  = await chromeLauncher.launch({});
  const remoteInterface = await CDP({port: chromeInstance.port});
  const {Network, Page} = remoteInterface;
  Network.requestIntercepted(({interceptionId, request}) => {
    const blocked = shallNotPass(request);
    console.log(`- ${blocked ? 'BLOCK' : 'ALLOW'} ${request.url}`);
    Network.continueInterceptedRequest({
      interceptionId,
      errorReason: blocked ? 'Aborted' : undefined
    });
  });
  await Network.enable();
  await Page.enable();
  await Network.setRequestInterceptionEnabled({enabled: true});
  await Network.setCacheDisabled({cacheDisabled: true});
  await Page.navigate({url: 'https://github.com'});
  await Page.loadEventFired();
  await remoteInterface.close();
  await chromeInstance.kill();
}

example();
```

Nothing is logged and requests for image urls are not blocked
