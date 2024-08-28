import path from 'path';
import { Rest } from '@adp/ui-common';

const rest = new Rest();

const { pathname } = window.location;
const configResponse = await fetch(path.join(pathname, 'deployment-config/frontend-config.json'));
const config = await configResponse.json();

rest.setBaseContext(config.rest);

export const execute = async (action) => {
  const { parameters } = action;
  const { value } = parameters.find((parameter) => parameter.name === 'endpoint');

  let endpoint;

  switch (value) {
    case 'apps':
      endpoint = '/ui-meta/v1/apps';
      break;
    case 'groups':
      endpoint = '/ui-meta/v1/groups';
      break;
    case 'components':
      endpoint = '/ui-meta/v1/components';
      break;
    default:
      endpoint = '/ui-meta/v1/apps';
      break;
  }

  let result;
  try {
    const response = await fetch(path.join(rest.getBaseContext(), endpoint));
    result = await response.json();
  } catch (error) {
    result = { error };
  }

  return result;
};
