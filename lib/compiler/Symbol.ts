enum SymbolScope {
  GlobalScope = 'GLOBAL',
  LocalScope = 'LOCAL',
}

class SymbolTable {
  _store: { [k: string]: Symbol };
  numDefinitions: number;
  outer: SymbolTable;

  constructor() {
    this._store = {};
    this.numDefinitions = 0;
    this.outer = null;
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

  resolve(name: string): Symbol {
    return this._store[name];
  }
}

class EnclosedSymbolTable extends SymbolTable {
  outer: SymbolTable;

  constructor(outer: SymbolTable) {
    super();
    this.outer = outer;
  }

  define(name: string): Symbol {
    const symbol = new Symbol(
      name,
      SymbolScope.LocalScope,
      this.numDefinitions
    );
    this.numDefinitions++;
    this._store[name] = symbol;
    return symbol;
  }

  resolve(name: string): Symbol {
    let obj = this.store[name];

    if (!obj && this.outer) {
      obj = this.outer.resolve(name);
    }

    return obj;
  }
}

class Symbol {
  constructor(
    public name: string,
    public scope: SymbolScope,
    public index: number
  ) {}
}

export { Symbol, SymbolTable, SymbolScope, EnclosedSymbolTable };
