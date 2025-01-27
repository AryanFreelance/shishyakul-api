const activateResolver = {
  Query: {
    activate: async () => {
      console.log("API Activated");
    },
  },
  Mutation: {},
};

export default activateResolver;
