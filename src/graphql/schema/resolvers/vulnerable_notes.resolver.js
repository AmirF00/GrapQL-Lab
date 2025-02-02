const Note = require('../../../models/note.model');

const vulnerableNotesResolver = {
  Query: {
    // Vulnerable: No authorization check
    getNoteById: async (_, { id }) => {
      return await Note.findById(id).populate('owner');
    },

    // Vulnerable: Returns all notes including private ones
    getAllNotes: async () => {
      return await Note.find({}).populate('owner');
    },

    // Vulnerable: Search exposes private notes
    searchNotes: async (_, { query }) => {
      return await Note.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } }
        ]
      }).populate('owner');
    }
  },

  Mutation: {
    createNote: async (_, { title, content, isPrivate }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      
      const note = new Note({
        title,
        content,
        isPrivate,
        owner: user.id
      });
      
      return await note.save();
    },

    // Vulnerable: No ownership verification
    updateNote: async (_, { id, title, content }) => {
      const note = await Note.findById(id);
      if (!note) throw new Error('Note not found');

      if (title) note.title = title;
      if (content) note.content = content;

      return await note.save();
    },

    // Vulnerable: No ownership verification
    deleteNote: async (_, { id }) => {
      await Note.findByIdAndDelete(id);
      return true;
    }
  }
};

module.exports = vulnerableNotesResolver; 