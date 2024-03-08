import {
  SymbolScope,
  SymbolTable,
  Symbol,
  EnclosedSymbolTable,
} from '../lib/compiler';

it('should resolve global defined symbols by name', () => {
  const global = new SymbolTable();
  global.define('a');
  global.define('b');

  const expected: Symbol[] = [
    new Symbol('a', SymbolScope.GlobalScope, 0),
    new Symbol('b', SymbolScope.GlobalScope, 1),
  ];

  expected.forEach((symbol) => {
    expect(global.resolve(symbol.name)).toEqual(symbol);
  });
});

it('should resolve local symbols', () => {
  const global = new SymbolTable();
  global.define('a');
  global.define('b');

  const local = new EnclosedSymbolTable(global);
  local.define('c');
  local.define('d');

  const expected: { name: string; symbol: Symbol }[] = [
    { name: 'a', symbol: new Symbol('a', SymbolScope.GlobalScope, 0) },
    { name: 'b', symbol: new Symbol('b', SymbolScope.GlobalScope, 1) },
    { name: 'c', symbol: new Symbol('c', SymbolScope.LocalScope, 0) },
    { name: 'd', symbol: new Symbol('d', SymbolScope.LocalScope, 1) },
  ];

  expected.forEach(({ name, symbol }) => {
    expect(local.resolve(name)).toEqual(symbol);
  });
});

it('should resolve nested local symbols', () => {
  const global = new SymbolTable();
  global.define('a');
  global.define('b');

  const firstLocal = new EnclosedSymbolTable(global);
  firstLocal.define('c');
  firstLocal.define('d');

  const secondLocal = new EnclosedSymbolTable(global);
  secondLocal.define('e');
  secondLocal.define('f');

  [
    { name: 'a', symbol: new Symbol('a', SymbolScope.GlobalScope, 0) },
    { name: 'b', symbol: new Symbol('b', SymbolScope.GlobalScope, 1) },
    { name: 'c', symbol: new Symbol('c', SymbolScope.LocalScope, 0) },
    { name: 'd', symbol: new Symbol('d', SymbolScope.LocalScope, 1) },
  ].forEach(({ name, symbol }) => {
    expect(firstLocal.resolve(name)).toEqual(symbol);
  });

  [
    { name: 'a', symbol: new Symbol('a', SymbolScope.GlobalScope, 0) },
    { name: 'b', symbol: new Symbol('b', SymbolScope.GlobalScope, 1) },
    { name: 'e', symbol: new Symbol('e', SymbolScope.LocalScope, 0) },
    { name: 'f', symbol: new Symbol('f', SymbolScope.LocalScope, 1) },
  ].forEach(({ name, symbol }) => {
    expect(secondLocal.resolve(name)).toEqual(symbol);
  });
});

it('should define symbols', () => {
  const global = new SymbolTable();
  const firstLocal = new EnclosedSymbolTable(global);
  const secondLocal = new EnclosedSymbolTable(global);

  const expected: { symbolTable: SymbolTable; name: string; symbol: Symbol }[] =
    [
      {
        symbolTable: global,
        name: 'a',
        symbol: new Symbol('a', SymbolScope.GlobalScope, 0),
      },
      {
        symbolTable: global,
        name: 'b',
        symbol: new Symbol('b', SymbolScope.GlobalScope, 1),
      },
      {
        symbolTable: firstLocal,
        name: 'c',
        symbol: new Symbol('c', SymbolScope.LocalScope, 0),
      },
      {
        symbolTable: firstLocal,
        name: 'd',
        symbol: new Symbol('d', SymbolScope.LocalScope, 1),
      },
      {
        symbolTable: secondLocal,
        name: 'e',
        symbol: new Symbol('e', SymbolScope.LocalScope, 0),
      },
      {
        symbolTable: secondLocal,
        name: 'f',
        symbol: new Symbol('f', SymbolScope.LocalScope, 1),
      },
    ];

  expected.forEach(({ symbolTable, name, symbol }) => {
    expect(symbolTable.define(name)).toEqual(symbol);
  });
});
