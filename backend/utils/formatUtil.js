const line = 'HIDDEN';
const privateFields = ['ca', 'cert', 'key', 'password', 'token'];

/**
 *  Censors object fields replacing values of with dedicated line.
 *
 * @param {object} obj - Initial object
 * @param {Array} [keys=privateFields] Object keys that hold sensitive information
 * @param {string} [obscuringLine=line] Line that will fill the key instead
 * @return {object} Resulting obj
 */
function censorObject(obj, keys = privateFields, obscuringLine = line) {
  let censored = JSON.stringify(obj);

  // censoring strings, booleans, numbers
  const commonRegexLine = keys
    .map((field) => `((?<="${field}":)[^{[](.+?)(?=[,\\]\\}]))`)
    .join('|');

  const commonRegex = new RegExp(commonRegexLine, 'g');
  censored = censored.replace(commonRegex, `"${obscuringLine}"`);

  // censoring arrays and objects
  const objArrayRegexLine = keys
    .map((field) => `((?<="${field}":)(?=[{[])(.+?)([}\\]]))`)
    .join('|');
  const objArrayRegex = new RegExp(objArrayRegexLine, 'g');
  censored = censored.replace(objArrayRegex, `"${obscuringLine}"`);

  return JSON.parse(censored);
}

export { censorObject };
