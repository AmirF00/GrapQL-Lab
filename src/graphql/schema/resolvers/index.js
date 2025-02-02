const userResolver = require('./user.resolver');
const postResolver = require('./post.resolver');
const vulnerableResolver = require('./vulnerable.resolver');
const vulnerableNotesResolver = require('./vulnerable_notes.resolver');
const vulnerableNoSQLResolver = require('./vulnerable_nosql.resolver');
const vulnerableSSRFResolver = require('./vulnerable_ssrf.resolver');
const vulnerableOrdersResolver = require('./vulnerable_orders.resolver');
const { mergeResolvers } = require('@graphql-tools/merge');

const resolvers = mergeResolvers([
  userResolver,
  postResolver,
  vulnerableResolver,
  vulnerableNotesResolver,
  vulnerableNoSQLResolver,
  vulnerableSSRFResolver,
  vulnerableOrdersResolver
]);

module.exports = resolvers; 