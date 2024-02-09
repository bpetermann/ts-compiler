enum SymbolScope {
  GlobalScope = 'GLOBAL',
}

class SymbolTable {
  _store: { [k: string]: Symbol };
  numDefinitions: number;

  constructor() {
    this._store = {};
    this.numDefinitions = 0;
  }

  get store() {
    return this._store;
  }

  define(name: string): Symbol {
    const symbol = new Symbol(
      name,
      SymbolScope.GlobalScope,
      this.numDefinitions
    );
    this.numDefinitions++;
    this._store[name] = symbol;
    return symbol;
  }

  resolve(name: string) {
    return this._store[name];
  }
}

class Symbol {
  constructor(
    public name: string,
    public scope: SymbolScope,
    public index: number
  ) {}
}

export { Symbol, SymbolTable, SymbolScope };
