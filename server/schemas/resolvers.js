const { User } = require ('../models');
const { signToken } = require ('../utils/auth');
const { AuthenticationError } = require('apollo-server-express');

const resolvers = {
    Query: {
        me: async () => {
            if (context.user) {
                return User.findOne({ _id: context.user._id }).populate('savedBooks');
            }
            throw new AuthenticationError('Not logged in');
        }
    },
    Mutation: {
        loginUser: async (parent, { email, password }) => {
            const user = await User.findOne({ email: email });
            if (!user) {
                throw new AuthenticationError('No User with this email');
            }
            const checkPass = await user.isCorrectPassword(password);
            if (!checkPass) {
                throw new AuthenticationError('Incorrect Password');
            }
            const token = signToken(user);

            return { token, user };
        },
        addUser: async (parent, args ) => {
            // args are username, email, password
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user };
        },
        saveBook: async (parent, args, context ) => {
            // args is and object containing authors, description, title, bookId, image, link
            const updatedUser = await User.findOneAndUpdate(
                { id: context.user._id },
                { $push: { savedBooks: args }},
                { new: true, runValidators: true }
            );
            return updatedUser;
        },
        removeBook: async (parent, { bookID }, context ) => {
            const updatedUser = await User.findOneAndUpdate(
                { _id: context.user._id },
                { $pull: { savedBooks: { bookID: bookID }}},
                { new: true}
            );
            return updatedUser;
        }
    }
}

module.exports = resolvers;