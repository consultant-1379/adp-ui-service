import * as fs from 'fs';
import yaml from 'js-yaml';
import fetch from 'node-fetch';
import xpath from 'xpath-html';

const DownloadLink = 'src_download_link';
const MissingBazaarField = 'MANDATORY_FOR_BAZAAR_REGISTRATION';

async function tryFetch(url, tries = 10) {
  let response = await fetch(url);
  if (!response.ok && tries > 0) {
    console.log(`Error with url: ${url}, trying again: ${tries}`);
    response = await tryFetch(url, tries - 1);
  }
  return response;
}

async function resolveBaseURL(communityUrl) {
  let srcBaseUrl;
  if (communityUrl.includes('github')) {
    srcBaseUrl = communityUrl;
  } else if (communityUrl.includes('npmjs')) {
    try {
      const response = await tryFetch(communityUrl);
      if (response.ok) {
        const text = await response.text();
        const h3 = xpath.fromPageSource(text).findElement("//h3[text()='Repository']");
        srcBaseUrl = h3.parentNode.getElementsByTagName('a')[0].getAttribute('href');
      } else {
        console.log(
          `Error fetching NPM page of the component: ${response.status}: ${response.statusText}`,
        );
      }
    } catch (e) {
      console.log(`Error fetching src link from NPM:`, e);
    }
  } else {
    console.log(`Unknown community URL: ${communityUrl}`);
  }
  return srcBaseUrl;
}

async function findSrcUrlForComponent(name, version, baseURL) {
  let [, shortName] = name.split('/');
  if (!shortName) {
    shortName = name;
  }
  // order matters, if multiple url works, then the first is selected.
  // Github url is prefferred over npm url.
  const tryUrls = [
    `${baseURL}/archive/${version}.zip`,
    `${baseURL}/archive/v${version}.zip`,
    `https://registry.npmjs.org/${name}/-/${shortName}-${version}.tgz`,
  ];
  try {
    const results = await Promise.all(tryUrls.map((url) => fetch(url)));
    results.forEach((result, index) => {
      result.originalURL = tryUrls[index];
    });
    const success = results.find((res) => res.ok);
    if (success) {
      return success.originalURL;
    }
    console.error(`FAILED: source is not found, tried urls: ${tryUrls.join(' ;')}`);
  } catch (e) {
    console.error(`FAILED src url checking: ${e}`);
  }
  return null;
}

async function processBazaarComponent(bazaarComponent) {
  const {
    component_name: name,
    component_version: version,
    community_url: communityUrl,
  } = bazaarComponent;
  console.log(`processing component: ${name}`);
  const srcBaseUrl = await resolveBaseURL(communityUrl);
  const srcURL = await findSrcUrlForComponent(name, version, srcBaseUrl);
  return srcURL;
}

// ------------- MAIN -------------------

// arguments
const cliArgs = process.argv.slice(2);
const file = cliArgs[0];
const doc = yaml.load(fs.readFileSync(file, 'utf8'));

console.log(`Processing file: ${file}`);

const couldNotResolved = [];

const componentsWithMissingURL = doc.dependencies
  .map((dependency) => dependency.bazaar)
  .filter(
    (bazaarComponent) =>
      bazaarComponent.register === 'yes' && bazaarComponent[DownloadLink] === MissingBazaarField,
  );

console.log(`Found ${componentsWithMissingURL.length} components with ${MissingBazaarField}`);

let promiseChain = Promise.resolve();
componentsWithMissingURL.forEach((bazaarComponent) => {
  promiseChain = promiseChain
    .then(() => processBazaarComponent(bazaarComponent))
    .then((srcURL) => {
      if (srcURL) {
        bazaarComponent[DownloadLink] = srcURL;
      } else {
        couldNotResolved.push(
          `Name: ${bazaarComponent.component_name} @ Version: ${bazaarComponent.component_version}`,
        );
      }
    });
});

promiseChain
  .then(() => {
    if (couldNotResolved.length > 0) {
      console.log('--------- Could not resolved: ---------');
      console.log(couldNotResolved.join('\n'));
      console.log('---------------------------------------');
    }
    fs.writeFileSync(`${file}`, yaml.dump(doc, { noArrayIndent: true, lineWidth: 1000 }), 'utf8');
    console.log(`Input file ${file} is updated with the source urls`);
  })
  .catch((e) => {
    console.error(`Unexpected Error: ${e}`);
  });
