const User = require('../../../models/user.model');
const Note = require('../../../models/note.model');

const vulnerableNoSQLResolver = {
  Query: {
    // Vulnerable: Direct string interpolation in query
    searchUsers: async (_, { query }) => {
      // VULNERABLE: Using string interpolation to build query
      const searchQuery = `{"email": {"$regex": "${query}"}}`;
      return await User.find(JSON.parse(searchQuery));
    },

    // Vulnerable: Unvalidated JSON parsing
    advancedFilter: async (_, { filterString }) => {
      // VULNERABLE: Directly parsing user input as MongoDB query
      const filter = JSON.parse(filterString);
      return await Note.find(filter).populate('owner');
    },

    // Vulnerable: Direct string interpolation in role filter
    findUsersByRole: async (_, { roleFilter }) => {
      // VULNERABLE: Using eval-like behavior with user input
      const query = `{ "role": "${roleFilter}" }`;
      return await User.find(JSON.parse(query));
    }
  }
};

module.exports = vulnerableNoSQLResolver; 