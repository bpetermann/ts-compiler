import { SymbolScope } from 'types';

const GlobalScope: SymbolScope = 'GLOBAL';

export default class SymbolTable {
  _store: Symbol[];
  numDefinitions: number;

  constructor() {
    this._store = [];
  }

  get store() {
    return this._store;
  }
}

class Symbol {
  constructor(
    public name: string,
    public scope: SymbolScope,
    public index: number
  ) {}
}
