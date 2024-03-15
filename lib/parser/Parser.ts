import { Token, TokenType, ExpressionType } from '../../types';
import { ParseError, precedences } from './helper';
import { isTokenType } from '../token';
import { Lexer } from '../lexer';
import setError from './error';
import * as ast from '../ast';

type StatementType =
  | ast.LetStatement
  | ast.ReturnStatement
  | ast.ExpressionStatement;

export default class Parser {
  private lexer: Lexer;
  private curToken!: Token;
  private peekToken: Token;
  private position: number;
  private program: ast.Program;
  private _errors: string[];
  private prefixParseFns: { [k: string]: () => ast.Identifier };
  private infixParseFns: {
    [k: string]: (left: ast.Expression) => ast.Identifier;
  };

  constructor(input: string) {
    this.position = 0;
    this.lexer = new Lexer(input);
    this.program = new ast.Program();
    this.peekToken = this.lexer.tokens[this.position];
    this._errors = [];
    this.prefixParseFns = {
      [TokenType.IDENT]: this.parseIdentifier.bind(this),
      [TokenType.INT]: this.parseIntegerLiteral.bind(this),
      [TokenType.BANG]: this.parsePrefixExpression.bind(this),
      [TokenType.MINUS]: this.parsePrefixExpression.bind(this),
      [TokenType.TRUE]: this.parseBoolean.bind(this),
      [TokenType.FALSE]: this.parseBoolean.bind(this),
      [TokenType.LPAREN]: this.parseGroupedExpression.bind(this),
      [TokenType.IF]: this.parseIfExpression.bind(this),
      [TokenType.FUNCTION]: this.parseFunction.bind(this),
      [TokenType.STRING]: this.parseStringLiteral.bind(this),
      [TokenType.LBRACKET]: this.parseArray.bind(this),
      [TokenType.LBRACE]: this.parseHashLiteral.bind(this),
    };
    this.infixParseFns = {
      [TokenType.PLUS]: this.parseInfixExpression.bind(this),
      [TokenType.MINUS]: this.parseInfixExpression.bind(this),
      [TokenType.SLASH]: this.parseInfixExpression.bind(this),
      [TokenType.ASTERISK]: this.parseInfixExpression.bind(this),
      [TokenType.EQ]: this.parseInfixExpression.bind(this),
      [TokenType.NOT_EQ]: this.parseInfixExpression.bind(this),
      [TokenType.LT]: this.parseInfixExpression.bind(this),
      [TokenType.GT]: this.parseInfixExpression.bind(this),
      [TokenType.LPAREN]: this.parseCallExpression.bind(this),
      [TokenType.LBRACKET]: this.parseIndexExpression.bind(this),
    };
  }

  get errors(): string[] {
    return this._errors;
  }

  nextToken(): void {
    this.curToken = this.peekToken;
    this.position += 1;
    this.peekToken = this.lexer.tokens[this.position];
  }

  parse(): ast.Program {
    this.nextToken();

    while (!isTokenType(this.curToken, TokenType.EOF)) {
      const stmt = this.parseStatement();
      if (stmt) {
        this.program.add(stmt);
      }

      this.nextToken();
    }

    return this.program;
  }

  parseStatement(): StatementType | null {
    switch (this.curToken.type) {
      case TokenType.LET:
        return this.parseLetStatement();
      case TokenType.RETURN:
        return this.parseReturnStatement();
      default:
        return this.parseExpressionStatement();
    }
  }

  curPrecedence(): number {
    return precedences(this.curToken.type);
  }

  peekPercedence(): number {
    return precedences(this.peekToken.type);
  }

  expectPeek(t: TokenType): boolean {
    if (isTokenType(this.peekToken, t)) {
      this.nextToken();
      return true;
    }

    this._errors.push(
      setError({
        type: 'expected',
        expected: t,
        got: (this.peekToken as Token).literal,
      })
    );
    return false;
  }

  parseLetStatement(): ast.LetStatement | null {
    const token = this.curToken;

    if (!this.expectPeek(TokenType.IDENT)) {
      return null;
    }

    const name = new ast.Identifier(this.curToken);

    if (!this.expectPeek(TokenType.ASSIGN)) {
      return null;
    }

    this.nextToken();

    const value = this.parseExpression(ExpressionType.LOWEST);

    if (!value) {
      return null;
    }

    const stmt = new ast.LetStatement(token, name, value);

    if (value instanceof ast.FunctionLiteral) {
      (value as ast.FunctionLiteral).name = stmt.name.value;
    }

    if (isTokenType(this.peekToken, TokenType.SEMICOLON)) {
      this.nextToken();
    }

    return stmt;
  }

  parseReturnStatement(): ast.ReturnStatement | null {
    const token = this.curToken;

    this.nextToken();

    const returnValue = this.parseExpression(ExpressionType.LOWEST);

    if (!returnValue) return null;

    if (isTokenType(this.peekToken, TokenType.SEMICOLON)) {
      this.nextToken();
    }

    return new ast.ReturnStatement(token, returnValue);
  }

  parseIdentifier(): ast.Identifier {
    return new ast.Identifier(this.curToken);
  }

  parseIntegerLiteral(): ast.IntegerLiteral {
    return new ast.IntegerLiteral(this.curToken);
  }

  parseBoolean(): ast.BooleanLiteral {
    return new ast.BooleanLiteral(this.curToken);
  }

  parseBlockStatement(): ast.BlockStatement {
    const block = new ast.BlockStatement(this.curToken);

    this.nextToken();

    while (
      !isTokenType(this.curToken, TokenType.RBRACE) &&
      !isTokenType(this.curToken, TokenType.EOF)
    ) {
      const stmt = this.parseStatement();

      if (stmt) {
        block.add(stmt);
      }

      this.nextToken();
    }

    return block;
  }

  parseIfExpression(): ast.IfExpression | null {
    const token = this.curToken;

    if (!this.expectPeek(TokenType.LPAREN)) {
      return null;
    }

    this.nextToken();

    const condition = this.parseExpression(ExpressionType.LOWEST);

    if (!condition) return null;

    if (!this.expectPeek(TokenType.RPAREN)) {
      return null;
    }

    if (!this.expectPeek(TokenType.LBRACE)) {
      return null;
    }

    const consequence = this.parseBlockStatement();

    const expression = new ast.IfExpression(token, condition, consequence);

    if (isTokenType(this.peekToken, TokenType.ELSE)) {
      this.nextToken();

      if (!this.expectPeek(TokenType.LBRACE)) {
        return null;
      }

      expression.alternative = this.parseBlockStatement();
    }

    return expression;
  }

  parseCallExpression(fn: ast.Expression): ast.CallExpression {
    return new ast.CallExpression(
      this.curToken,
      fn,
      this.parseExpressionList(TokenType.RPAREN)
    );
  }

  parseFunctionParameters(): ast.Identifier[] {
    const identifiers: ast.Identifier[] = [];

    if (isTokenType(this.peekToken, TokenType.RPAREN)) {
      this.nextToken();
      return identifiers;
    }

    this.nextToken();

    const ident = new ast.Identifier(this.curToken);
    identifiers.push(ident);

    while (isTokenType(this.peekToken, TokenType.COMMA)) {
      this.nextToken();
      this.nextToken();
      const ident = new ast.Identifier(this.curToken);
      identifiers.push(ident);
    }

    if (!this.expectPeek(TokenType.RPAREN))
      throw new ParseError(TokenType.RPAREN);

    return identifiers;
  }

  parseFunction(): ast.FunctionLiteral | null {
    const token = this.curToken;

    if (!this.expectPeek(TokenType.LPAREN)) {
      return null;
    }

    const parameters = this.parseFunctionParameters();

    if (!this.expectPeek(TokenType.LBRACE)) {
      return null;
    }

    const body = this.parseBlockStatement();

    return new ast.FunctionLiteral(token, parameters, body);
  }

  parseGroupedExpression(): ast.Expression | null {
    this.nextToken();

    const expression = this.parseExpression(ExpressionType.LOWEST);

    if (!this.expectPeek(TokenType.RPAREN)) {
      return null;
    }

    return expression;
  }

  parsePrefixExpression(): ast.PrefixExpression | null {
    const token = this.curToken;

    this.nextToken();

    const right = this.parseExpression(ExpressionType.PREFIX);

    if (!right) return null;

    return new ast.PrefixExpression(token, right);
  }

  parseInfixExpression(left: ast.Expression): ast.InfixExpression | null {
    const token = this.curToken;

    const precedence = precedences(this.curToken.type);

    this.nextToken();

    const right = this.parseExpression(precedence);

    if (!right) return null;

    return new ast.InfixExpression(token, left, right);
  }

  parseStringLiteral(): ast.StringLiteral {
    return new ast.StringLiteral(this.curToken);
  }

  parseExpressionList(end: TokenType): ast.Expression[] {
    let list: ast.Expression[] = [];

    if (isTokenType(this.peekToken, end)) {
      this.nextToken();
      return list;
    }

    this.nextToken();

    const expression = this.parseExpression(ExpressionType.LOWEST);

    if (!expression) throw new ParseError('Expression');

    list.push(expression);

    while (isTokenType(this.peekToken, TokenType.COMMA)) {
      this.nextToken();
      this.nextToken();
      const expression = this.parseExpression(ExpressionType.LOWEST);

      if (!expression) throw new ParseError('Expression');

      list.push(expression);
    }

    if (!this.expectPeek(end)) throw new ParseError(end);

    return list;
  }

  parseArray(): ast.ArrayLiteral {
    const elements = this.parseExpressionList(TokenType.RBRACKET);

    return new ast.ArrayLiteral(this.curToken, elements);
  }

  parseIndexExpression(left: ast.Expression): ast.Expression | null {
    const token = this.curToken;

    this.nextToken();

    const index = this.parseExpression(ExpressionType.LOWEST);

    if (!index || !this.expectPeek(TokenType.RBRACKET)) return null;

    return new ast.IndexExpression(token, left, index);
  }

  parseHashLiteral(): ast.HashLiteral | null {
    const token = this.curToken;
    const pairs = new Map();

    while (!isTokenType(this.peekToken, TokenType.RBRACE)) {
      this.nextToken();
      const key = this.parseExpression(ExpressionType.LOWEST);

      if (!this.expectPeek(TokenType.COLON) || !key) return null;

      this.nextToken();

      const value = this.parseExpression(ExpressionType.LOWEST);

      if (!value) return null;

      pairs.set(key, value);

      if (
        !isTokenType(this.peekToken, TokenType.RBRACE) &&
        !this.expectPeek(TokenType.COMMA)
      )
        return null;
    }

    if (!this.expectPeek(TokenType.RBRACE)) return null;

    return new ast.HashLiteral(token, pairs);
  }

  parseExpression(precedence: ExpressionType): ast.Expression | null {
    const prefix = this.prefixParseFns[this.curToken?.type];

    if (!prefix) {
      this._errors.push(
        setError({ type: 'parse', got: this.curToken.literal })
      );
      return null;
    }

    let leftExpression = prefix();

    while (
      !isTokenType(this.peekToken, TokenType.SEMICOLON) &&
      precedence < this.peekPercedence()
    ) {
      const infix =
        this.infixParseFns[(this.peekToken as any).type as TokenType];

      if (!infix) {
        return leftExpression;
      }

      this.nextToken();

      leftExpression = infix(leftExpression);
    }

    return leftExpression;
  }

  parseExpressionStatement(): ast.ExpressionStatement | null {
    const token = this.curToken;

    const expression = this.parseExpression(ExpressionType.LOWEST);

    if (!expression) return null;

    if (isTokenType(this.peekToken, TokenType.SEMICOLON)) {
      this.nextToken();
    }

    return new ast.ExpressionStatement(token, expression);
  }
}
