import { Expression, Statement, Token } from '../../types';
import colors from 'colors';

class IntegerLiteral implements Expression {
  value: number;

  constructor(public token: Token) {
    this.value = Number(token.literal);
  }

  expressionNode!: () => void;

  getString(): string {
    return colors.blue(`${this.value}`);
  }

  tokenLiteral(): string {
    return this.token.literal;
  }
}

class BooleanLiteral implements Expression {
  value: boolean;

  constructor(public token: Token) {
    this.value = token.literal === 'true' ? true : false;
  }

  expressionNode!: () => void;

  getString(): string {
    return colors.blue(`${this.value}`);
  }

  tokenLiteral(): string {
    return this.token.literal;
  }
}

class PrefixExpression implements Expression {
  operator: string;

  constructor(public token: Token, public right: Expression) {
    this.operator = this.token.literal;
  }

  getString(): string {
    return colors.green(`(${this.token.literal} ${this.right?.getString()})`);
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  expressionNode!: () => void;
}

class InfixExpression implements Expression {
  operator: string;

  constructor(
    public token: Token,
    public left: Expression,
    public right: Expression
  ) {
    this.operator = this.token.literal;
  }

  getString(): string {
    return colors.green(
      `(${this.left.getString()} ${
        this.token.literal
      } ${this.right.getString()})`
    );
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  expressionNode!: () => void;
}

class Identifier implements Expression {
  value: string;

  constructor(public token: Token) {
    this.value = token.literal;
  }

  getString(): string {
    return colors.blue(`${this.token.literal}`);
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  expressionNode!: () => void;
}

class IfExpression implements Expression {
  alternative?: Statement;

  constructor(
    public token: Token,
    public condition: Expression,
    public consequence: Statement
  ) {}

  getString(): string {
    return colors.magenta(
      `if ${this.condition.getString()} ${this.consequence.getString()} ${
        this.alternative ? 'else ' + this.alternative.getString() : ''
      }`
    );
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  expressionNode!: () => void;
}

class FunctionLiteral implements Expression {
  constructor(
    public token: Token,
    public parameters: Identifier[],
    public body: Statement
  ) {}

  getString(): string {
    return colors.magenta(
      `${this.tokenLiteral()}(${this.parameters
        .map((param) => param.getString())
        .join(', ')}) {${this.body.getString()}}`
    );
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  expressionNode!: () => void;
}

class CallExpression implements Expression {
  function: Expression;
  arguments: Expression[];

  constructor(public token: Token, fn: Expression, args: Expression[]) {
    this.function = fn;
    this.arguments = args;
  }

  getString(): string {
    return colors.magenta(
      `${this.function.getString()}(${this.arguments
        .map((param) => param.getString())
        .join(', ')})`
    );
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  expressionNode!: () => void;
}

class StringLiteral implements Expression {
  value: string;

  constructor(public token: Token) {
    this.value = token.literal;
  }

  getString(): string {
    return colors.blue(this.token.literal);
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  expressionNode!: () => void;
}

class ArrayLiteral implements Expression {
  constructor(public token: Token, public elements: Expression[]) {}

  getString(): string {
    return colors.magenta(
      `[${this.elements.map((el) => el.getString()).join(',')}]`
    );
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  expressionNode!: () => void;
}

class IndexExpression implements Expression {
  constructor(
    public token: Token,
    public left: Expression,
    public index: Expression
  ) {}

  getString(): string {
    return colors.magenta(
      `(${this.left.getString()}[${this.index.getString()}])`
    );
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  expressionNode!: () => void;
}

class HashLiteral implements Expression {
  constructor(public token: Token, public pairs: Map<Expression, Expression>) {}

  getString(): string {
    const keyValues: string[] = [];
    [...this.pairs].map(([key, value]) =>
      keyValues.push(`${key.getString()}: ${value.getString()}`)
    );
    return colors.magenta(`{${keyValues.join(', ')}}`);
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  expressionNode!: () => void;
}

export {
  Expression,
  Identifier,
  PrefixExpression,
  IntegerLiteral,
  InfixExpression,
  BooleanLiteral,
  IfExpression,
  FunctionLiteral,
  CallExpression,
  StringLiteral,
  ArrayLiteral,
  IndexExpression,
  HashLiteral,
};
