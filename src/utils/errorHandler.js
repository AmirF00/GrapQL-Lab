const { GraphQLError } = require('graphql');

const formatError = (error) => {
  // Log the error
  console.error('GraphQL Error:', error);

  if (error.originalError instanceof GraphQLError) {
    return error;
  }

  // Custom error formatting
  return new GraphQLError(
    error.message,
    {
      extensions: {
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && {
          stacktrace: error.stack
        })
      }
    }
  );
};

module.exports = { formatError };
