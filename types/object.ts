export interface Env {
  get: (name: string) => Object;
  set: (name: string, val: Object) => Object;
}

export const enum ObjectType {
  INTEGER_OBJ = 'INTEGER',
  BOOLEAN_OBJ = 'BOOLEAN',
  NULL_OBJ = 'NULL',
  RETURN_VALUE_OBJ = 'RETURN_VALUE',
  ERROR_OBJ = 'ERROR',
  FUNCTION_OBJ = 'FUNCTION',
  STRING_OBJ = 'STRING',
  BUILTIN_OBJ = 'BUILTIN',
  ARRAY_OBJ = 'ARRAY',
  HASH_OBJ = 'HASH',
  COMPILED_FUNCTION_OBJ = 'COMPILED_FUNCTION_OBJ',
  CLOSURE_OBJ = "CLOSURE"
}

export interface Object {
  type: () => ObjectType;
  inspect: () => string;
}
