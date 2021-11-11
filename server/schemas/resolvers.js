const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
// Import sign token function from auth
const { signToken } = require('../utils/auth');

const resolvers = {
	Query: {
		me: async (parent, args, { user }) => {
			if (user) {
				return User.findOne({ _id: user._id }).populate('savedBooks');
			}
			throw new AuthenticationError('You need to be logged in!');
		},
	},
	Mutation: {
		// login a user, sign a token, and send it back (to client/src/components/LoginForm.js)
		login: async (parent, { email, password }) => {
			const user = await User.findOne({ email: email });

			if (!user) {
				throw new AuthenticationError('Incorrect credentials');
			}

			const correctPw = await user.isCorrectPassword(password);

			if (!correctPw) {
				throw new AuthenticationError('Incorrect credentials');
			}

			const token = signToken(user);
			return { token, user };
		},
		// Create a user, sign a token, and send it back (to client/src/components/SignUpForm.js)
		addUser: async (parent, { username, email, password }) => {
			const user = await User.create({ username, email, password });
			const token = signToken(user);
			return { token, user };
		},
		/* Save a book to a user's `savedBooks` field by adding it to the set (to prevent duplicates). */
		saveBook: async (parent, { book }, { user }) => {
			try {
				if (user) {
					const updatedUser = await User.findOneAndUpdate(
						{ _id: user._id },
						{ $addToSet: { savedBooks: book } },
						{ new: true, runValidators: true }
					);
					return updatedUser;
				}
			} catch (err) {
				console.log(err);
				throw new AuthenticationError(`${err}`);
			}
		},
		// Remove a book from `savedBooks`
		removeBook: async (parent, { bookId }, { user }) => {
			try {
				const updatedUser = await User.findOneAndUpdate(
					{ _id: user._id },
					{ $pull: { savedBooks: { bookId: bookId } } },
					{ new: true }
				);

				if (!updatedUser) {
					throw new AuthenticationError("Couldn't find user with this id!");
				}
				return updatedUser;
			} catch (err) {
				console.log(err);
				throw new AuthenticationError(`${err}`);
			}
		},
	},
};

module.exports = resolvers;
