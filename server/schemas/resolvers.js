const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
// Import sign token function from auth
const { signToken } = require('../utils/auth');

const resolvers = {
	Query: {
		// // Get a single user by either their id or their username
		// user: async (parent, { user = null, params }) => {
		// 	const foundUser = await User.findOne({
		// 		$or: [
		// 			{ _id: user ? user._id : params.id },
		// 			{ username: params.username },
		// 		],
		// 	});

		// 	if (!foundUser) {
		// 		throw new AuthenticationError('Cannot find a user with this id!');
		// 	}

		// 	return foundUser;
		// },
		// By adding context to our query, we can retrieve the logged in user without specifically searching for them
		me: async (parent, args, context) => {
			if (context.user) {
				return User.findOne({ _id: context.user._id });
			}
			throw new AuthenticationError('You need to be logged in!');
		},
	},
	Mutation: {
		// login a user, sign a token, and send it back (to client/src/components/LoginForm.js)
		login: async (parent, { body }) => {
			const user = await User.findOne({ email: body.email });

			if (!user) {
				throw new AuthenticationError("Can't find this user");
			}

			const correctPw = await user.isCorrectPassword(body.password);

			if (!correctPw) {
				throw new AuthenticationError('Wrong password!');
			}

			const token = signToken(user);
			return { token, user };
		},
		// Create a user, sign a token, and send it back (to client/src/components/SignUpForm.js)
		addUser: async (parent, { body }) => {
			const user = await User.create(body);
			const token = signToken(user);
			return { token, user };
		},
		/* Save a book to a user's `savedBooks` field by adding it to the set (to prevent duplicates). */
		saveBook: async (parent, { body }, context) => {
			try {
				if (context.user) {
					const updatedUser = await User.findOneAndUpdate(
						{ _id: context.user._id },
						{ $addToSet: { savedBooks: body } },
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
		removeBook: async (parent, { user, params }) => {
			const updatedUser = await User.findOneAndUpdate(
				{ _id: user._id },
				{ $pull: { savedBooks: { bookId: params.bookId } } },
				{ new: true }
			);

			if (!updatedUser) {
				throw new AuthenticationError("Couldn't find user with this id!");
			}
			return res.json(updatedUser);
		},
	},
};

module.exports = resolvers;
