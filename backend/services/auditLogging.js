import { getLogger, LOG_LEVELS } from './logging.js';

const logger = getLogger('audit');

/**
 * Get audit information from a log event's context.
 *
 * @param {object} context - The log event's context
 *
 * @returns {object} The audit information
 */
function getAuditInformation(meta) {
  const { req, res } = meta;
  const auditInformation = {};

  if (req) {
    auditInformation.subject = req?.user.username;
    auditInformation.url = req.originalUrl;
    auditInformation.method = req.method;
  }

  if (res && res.headersSent) {
    auditInformation.response_code = res.statusCode;
    auditInformation.response_message = res.getHeader('content-length');
  }
  return auditInformation;
}

/**
 * Get the audit information as a formatted text string.
 *
 * @param {object} auditInformation - The audit information
 *
 * @returns {string} The formatted audit information
 */
function formatAuditInformation(auditInformation) {
  const formattedAuditInformation = [
    `Subject: ${auditInformation.subject || 'n/a'}`,
    `URL: ${auditInformation.url || 'n/a'}`,
    `Method: ${auditInformation.method || 'n/a'}`,
    `Response code: ${auditInformation.response_code || 'n/a'}`,
    `Response (bytes): ${auditInformation.response_message || 'n/a'}`,
  ];
  return formattedAuditInformation.join('; ');
}

const getAuditLogger = (meta) => {
  if (typeof meta !== 'object') {
    throw new Error(`getAuditLogger expect an object as metadata. Got instead: ${meta}`);
  }
  const handler = {
    get(target, prop, receiver) {
      if (prop in LOG_LEVELS) {
        return (...args) => {
          const auditMsg = formatAuditInformation(getAuditInformation(meta));
          args[0] = `${args[0]} { ${auditMsg} }`;
          return target[prop](...args, meta);
        };
      }
      if (prop === 'log') {
        throw new Error(`getAuditLogger does not support the generic log method directly.`);
      }
      return Reflect.get(target, prop, receiver);
    },
  };
  return new Proxy(logger, handler);
};

export { getAuditLogger };
