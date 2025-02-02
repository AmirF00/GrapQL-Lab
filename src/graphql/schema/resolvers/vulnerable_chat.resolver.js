const Message = require('../../../models/message.model');
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();

// Vulnerable: Using simple strings as trigger names
const TRIGGERS = {
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  USER_TYPING: 'USER_TYPING',
  USER_PRESENCE: 'USER_PRESENCE',
  ROOM_ACTIVITY: 'ROOM_ACTIVITY'
};

const vulnerableChatResolver = {
  Query: {
    getRoomMessages: async (_, { room }) => {
      return await Message.find({ room }).populate('sender');
    },
    
    getActiveUsers: async (_, { room }) => {
      // Vulnerable: Returns all users without proper filtering
      return await User.find({ lastSeen: { $gt: new Date(Date.now() - 3600000) } });
    }
  },

  Mutation: {
    sendMessage: async (_, { room, content, metadata }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      // Vulnerable: No content validation or sanitization
      const message = new Message({
        content,
        sender: user.id,
        room,
        timestamp: new Date().toISOString(),
        metadata // Vulnerable: No metadata validation
      });

      await message.save();

      // Change: Add room to the trigger name
      pubsub.publish(`${TRIGGERS.MESSAGE_RECEIVED}.${room}`, {
        messageReceived: await message.populate('sender')
      });

      // Vulnerable: Broadcasting room activity without validation
      pubsub.publish(TRIGGERS.ROOM_ACTIVITY, {
        roomActivity: {
          type: 'NEW_MESSAGE',
          room,
          data: metadata
        }
      });

      return message;
    },

    setTypingStatus: async (_, { room, isTyping }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      // Vulnerable: No rate limiting on typing status updates
      pubsub.publish(TRIGGERS.USER_TYPING, {
        userTyping: {
          user,
          room,
          isTyping
        }
      });

      return true;
    },

    joinRoom: async (_, { room }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      // Vulnerable: No validation on room names
      pubsub.publish(TRIGGERS.ROOM_ACTIVITY, {
        roomActivity: {
          type: 'USER_JOINED',
          room,
          user: user.id
        }
      });

      return true;
    },

    leaveRoom: async (_, { room }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      pubsub.publish(TRIGGERS.ROOM_ACTIVITY, {
        roomActivity: {
          type: 'USER_LEFT',
          room,
          user: user.id
        }
      });

      return true;
    }
  },

  Subscription: {
    messageReceived: {
      subscribe: (_, { room }) => {
        // Change: Subscribe to room-specific events
        return pubsub.asyncIterator([`${TRIGGERS.MESSAGE_RECEIVED}.${room}`])
      }
    },

    userTyping: {
      subscribe: (_, { room }) => pubsub.asyncIterator([TRIGGERS.USER_TYPING])
    },

    userPresence: {
      subscribe: (_, { userId }) => pubsub.asyncIterator([TRIGGERS.USER_PRESENCE])
    },

    roomActivity: {
      subscribe: (_, { room }) => pubsub.asyncIterator([TRIGGERS.ROOM_ACTIVITY])
    }
  }
};

module.exports = vulnerableChatResolver; 