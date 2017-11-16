const chromeLauncher = require('chrome-launcher');
const CDP            = require('chrome-remote-interface');
const url            = require('url');

function shallNotPass(request) {
  const {pathname} = url.parse(request.url);
  return pathname.match(/\.(css|png|svg)/);
}

async function example() {
  // Toggle this to `true` and interception will work
  const runAsHeadless = false;

  const chromeInstance  = await chromeLauncher.launch({chromeFlags: runAsHeadless ? ['--headless'] : []});
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
  await Network.setRequestInterception({patterns: [{urlPattern: '*'}]});
  await Network.setCacheDisabled({cacheDisabled: true});
  await Page.navigate({url: 'http://perfectmotherfuckingwebsite.com/'});
  await Page.loadEventFired();
  await remoteInterface.close();
  await chromeInstance.kill();
}

example();
