import { Object } from '../../types';
import * as obj from '../object';

export const builtins: { name: string; builtin: obj.Builtin }[] = [
  {
    name: 'len',
    builtin: new obj.Builtin((...args: any): Object => {
      if (args.length !== 1)
        return new obj.Error({ type: 'args', msg: args.length });

      if (args[0] instanceof obj.String) {
        return new obj.Integer(args[0].value.length);
      }

      if (args[0] instanceof obj.Array) {
        return new obj.Integer(args[0].elements.length);
      }

      return new obj.Error({
        type: 'support',
        msg: 'len',
        got: args[0].type(),
      });
    }),
  },
  {
    name: 'log',
    builtin: new obj.Builtin((...args: any): null => {
      args.map((arg: Object) => console.log(arg.inspect()));

      return null;
    }),
  },
  {
    name: 'first',
    builtin: new obj.Builtin((...args: any): Object => {
      if (args.length !== 1)
        return new obj.Error({ type: 'args', msg: args.length });

      if (!(args[0] instanceof obj.Array)) {
        return new obj.Error({
          type: 'support',
          msg: 'first',
          got: args[0].type(),
        });
      }

      return args[0].elements[0];
    }),
  },

  {
    name: 'last',
    builtin: new obj.Builtin((...args: any): Object | null => {
      if (args.length !== 1)
        return new obj.Error({ type: 'args', msg: args.length });

      if (!(args[0] instanceof obj.Array)) {
        return new obj.Error({
          type: 'support',
          msg: 'last',
          got: args[0].type(),
        });
      }
      const { elements } = args[0];
      return elements.length > 0 ? elements[elements.length - 1] : null;
    }),
  },
  {
    name: 'rest',
    builtin: new obj.Builtin((...args: any): Object | null => {
      if (args.length !== 1)
        return new obj.Error({ type: 'args', msg: args.length });

      if (!(args[0] instanceof obj.Array)) {
        return new obj.Error({
          type: 'support',
          msg: 'rest',
          got: args[0].type(),
        });
      }
      const { elements } = args[0];
      if (elements.length > 0) {
        return new obj.Array(elements.slice(1));
      }

      return null;
    }),
  },
  {
    name: 'push',
    builtin: new obj.Builtin((...args: any): Object => {
      if (args.length !== 2)
        return new obj.Error({ type: 'args', msg: args.length });

      if (!(args[0] instanceof obj.Array)) {
        return new obj.Error({
          type: 'support',
          msg: 'push',
          got: args[0].type(),
        });
      }
      const { elements } = args[0];

      return new obj.Array([...elements, args[1]]);
    }),
  },
  {
    name: 'pop',
    builtin: new obj.Builtin((...args: any): Object => {
      if (args.length !== 1)
        return new obj.Error({ type: 'args', msg: args.length });

      if (!(args[0] instanceof obj.Array)) {
        return new obj.Error({
          type: 'support',
          msg: 'pop',
          got: args[0].type(),
        });
      }
      const { elements } = args[0];

      elements.pop();
      return new obj.Array(elements);
    }),
  },
  {
    name: 'toUpper',
    builtin: new obj.Builtin((...args: any): Object => {
      if (args.length !== 1) {
        return new obj.Error({
          type: 'args',
          msg: args.length,
        });
      }

      if (!(args[0] instanceof obj.String)) {
        return new obj.Error({
          type: 'support',
          msg: 'toUpper',
          got: args[0].type(),
        });
      }

      return new obj.String(args[0].value.toUpperCase());
    }),
  },
  {
    name: 'toLower',
    builtin: new obj.Builtin((...args: any): Object => {
      if (args.length !== 1)
        return new obj.Error({ type: 'args', msg: args.length });

      if (!(args[0] instanceof obj.String)) {
        return new obj.Error({
          type: 'support',
          msg: 'toLower',
          got: args[0].type(),
        });
      }

      return new obj.String(args[0].value.toLowerCase());
    }),
  },
  {
    name: 'clock',
    builtin: new obj.Builtin((): null => {
      console.time();
      return null;
    }),
  },
  {
    name: 'clockEnd',
    builtin: new obj.Builtin((): null => {
      console.timeEnd();
      return null;
    }),
  },
];

export const getBuiltinByName = (name: string): obj.Builtin | null => {
  const index = builtins.findIndex((builtin) => builtin.name === name);
  return index > -1 ? builtins[index].builtin : null;
};
