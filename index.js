const chromeLauncher = require('chrome-launcher');
const CDP            = require('chrome-remote-interface');
const url            = require('url');

function shallNotPass(request) {
  const {pathname} = url.parse(request.url);
  return pathname.match(/\.(css|png|svg)$/);
}

async function example() {
  // Does not work
  const chromeInstance  = await chromeLauncher.launch({});
  // Does work
  //const chromeInstance  = await chromeLauncher.launch({chromeFlags: ['--headless', '--disable-gpu']});
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
