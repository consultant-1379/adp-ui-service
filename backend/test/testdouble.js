import * as td from 'testdouble';

/**
 * This config provides the possibility to extend default testdouble module
 * and add additional methods.
 *
 * @param {function} setProp - This function provides the possibility to mock method
 * and call real method when mocked method is called. If setProp method is called then
 * td.when method can't be called anymore for mocked function.
 * If td.when functionality is necessary then td.func, td.replace or td.when().thenDo methods could be used
 * for configuring calling real method.
 */

export default {
  ...td,
  spyProp(object, propName) {
    let result = null;
    if (typeof object === 'object' && typeof propName === 'string') {
      let prop = object[propName];
      if (typeof prop === 'function') {
        prop = prop.bind(object);
        object[propName] = td.replace(object, propName);
        td.when(object[propName](), { ignoreExtraArgs: true }).thenDo(prop);
        result = object[propName];
      }
    }
    return result;
  },
};
