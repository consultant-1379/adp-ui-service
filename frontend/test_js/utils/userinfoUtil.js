import fetch from 'node-fetch';
import path from 'path';

export const enableUserinfoEndpoint = async () => {
  await fetch(path.join(browser.options.baseUrl, '../testing/userinfo/enable'));
};

export const disableUserinfoEndpoint = async () => {
  await fetch(path.join(browser.options.baseUrl, '../testing/userinfo/disable'));
};
