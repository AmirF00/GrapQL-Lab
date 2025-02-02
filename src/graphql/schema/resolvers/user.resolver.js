const User = require('../../../models/user.model');
const AuthService = require('../../../services/auth.service');

const userResolver = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return User.findById(user.id);
    },
    users: async (_, __, { user }) => {
      if (!user || user.role !== 'ADMIN') throw new Error('Not authorized');
      return User.find({});
    },
    user: async (_, { id }) => {
      return User.findById(id);
    },
  },
  Mutation: {
    signUp: async (_, { input }) => {
      return AuthService.signUp(input);
    },
    signIn: async (_, { input }) => {
      return AuthService.signIn(input);
    },
    updateUser: async (_, { id, name }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return User.findByIdAndUpdate(id, { name }, { new: true });
    },
    deleteUser: async (_, { id }, { user }) => {
      if (!user || user.role !== 'ADMIN') throw new Error('Not authorized');
      await User.findByIdAndDelete(id);
      return true;
    },
    createAdmin: async (_, { input, secretKey }) => {
      if (secretKey !== process.env.ADMIN_SECRET_KEY) {
        throw new Error('Invalid secret key');
      }
      
      const adminInput = {
        ...input,
        role: 'ADMIN'
      };
      
      return AuthService.signUp(adminInput);
    },
  },
  Subscription: {
    userCreated: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(['USER_CREATED']),
    },
  },
};

module.exports = userResolver;
