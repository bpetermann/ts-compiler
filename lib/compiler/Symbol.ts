enum SymbolScope {
  GlobalScope = 'GLOBAL',
  LocalScope = 'LOCAL',
  BuiltinScope = 'BUILTIN',
  FreeScope = 'FREE',
  FunctionScope = 'FUNCTION',
}

class SymbolTable {
  _store: { [k: string]: Symbol };
  numDefinitions: number;
  freeSymbols: Symbol[];

  constructor() {
    this._store = {};
    this.numDefinitions = 0;
    this.freeSymbols = [];
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

  defineBuiltin(index: number, name: string): Symbol {
    const symbol = new Symbol(name, SymbolScope.BuiltinScope, index);
    this._store[name] = symbol;
    return symbol;
  }

  defineFunctionName(name: string): Symbol {
    const symbol = new Symbol(name, SymbolScope.FunctionScope, 0);
    this._store[name] = symbol;
    return symbol;
  }

  defineFree(original: Symbol): Symbol {
    this.freeSymbols.push(original);
    const symbol = new Symbol(
      original.name,
      SymbolScope.FreeScope,
      this.freeSymbols.length - 1
    );
    this.store[original.name] = symbol;
    return symbol;
  }

  resolve(name: string): Symbol {
    return this._store[name];
  }
}

class EnclosedSymbolTable extends SymbolTable {
  constructor(public outer: SymbolTable) {
    super();
    this.outer = outer;
  }

  override define(name: string): Symbol {
    const symbol = new Symbol(
      name,
      SymbolScope.LocalScope,
      this.numDefinitions
    );
    this.numDefinitions++;
    this._store[name] = symbol;
    return symbol;
  }

  override resolve(name: string): Symbol {
    let obj = this.store[name];

    if (!obj && this.outer) {
      obj = this.outer.resolve(name);

      if (obj) {
        if (
          obj.scope === SymbolScope.GlobalScope ||
          obj.scope === SymbolScope.BuiltinScope
        )
          return obj;

        const free = this.defineFree(obj);
        return free;
      }
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
