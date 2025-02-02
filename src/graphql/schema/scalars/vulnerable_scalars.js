const { GraphQLScalarType } = require('graphql');

// Vulnerable Price scalar with no validation
const Price = new GraphQLScalarType({
  name: 'Price',
  description: 'Custom scalar type for price',
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: (ast) => ast.value
});

// Vulnerable JSON scalar with no validation
const JSONData = new GraphQLScalarType({
  name: 'JSONData',
  description: 'Custom scalar type for JSON data',
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: (ast) => JSON.parse(ast.value)
});

module.exports = { Price, JSONData }; 