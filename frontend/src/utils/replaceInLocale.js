export default (stringValue, variables) => {
  if (variables) {
    variables.forEach((variable) => {
      const { name, value } = variable;
      const regExp = new RegExp(`{{${name}}}`, 'g');
      stringValue = stringValue.replace(regExp, value);
    });
  }
  return stringValue;
};
