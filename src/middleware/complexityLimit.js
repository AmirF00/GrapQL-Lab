const { GraphQLError } = require('graphql');

const complexityLimit = {
  Query: async (resolve, root, args, context, info) => {
    // Basic query complexity calculation
    const complexity = calculateComplexity(info);
    if (complexity > 100) { // Adjust this number based on your needs
      throw new GraphQLError('Query is too complex');
    }
    return await resolve(root, args, context, info);
  }
};

const calculateComplexity = (info) => {
  let complexity = 0;
  const fieldNodes = info.fieldNodes || [];
  
  fieldNodes.forEach(node => {
    complexity += countSelectionSet(node.selectionSet);
  });
  
  return complexity;
};

const countSelectionSet = (selectionSet) => {
  if (!selectionSet) return 1;
  
  return selectionSet.selections.reduce((total, selection) => {
    if (selection.selectionSet) {
      return total + countSelectionSet(selection.selectionSet);
    }
    return total + 1;
  }, 0);
};

module.exports = { complexityLimit };
