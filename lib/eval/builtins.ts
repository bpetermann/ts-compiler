import * as obj from '../object';

const builtins = {
  len: obj.getBuiltinByName('len'),
  toLower: obj.getBuiltinByName('toLower'),
  toUpper: obj.getBuiltinByName('toUpper'),
  first: obj.getBuiltinByName('first'),
  last: obj.getBuiltinByName('last'),
  rest: obj.getBuiltinByName('rest'),
  push: obj.getBuiltinByName('push'),
  pop: obj.getBuiltinByName('pop'),
  log: obj.getBuiltinByName('log'),
};

export { builtins };
