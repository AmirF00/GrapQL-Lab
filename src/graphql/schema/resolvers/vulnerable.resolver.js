const vulnerableResolver = {
  Query: {
    getFriends: async () => {
      // Create an array of 5 friends
      return Array(5).fill(null).map((_, index) => ({
        id: `friend-${index}`,
        name: `Friend ${index}`,
        friends: [] // Will be populated by the Friend resolver
      }));
    }
  },
  Friend: {
    friends: async (parent) => {
      // Each friend has 5 more friends
      return Array(5).fill(null).map((_, index) => ({
        id: `${parent.id}-friend-${index}`,
        name: `${parent.name}'s Friend ${index}`,
        friends: []
      }));
    }
  }
};

module.exports = vulnerableResolver; 
