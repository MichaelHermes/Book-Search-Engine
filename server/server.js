const express = require('express');
const path = require('path');
const db = require('./config/connection');
const { typeDefs, resolvers } = require('./schemas');
// Import the Apollo Server components.
const { ApolloServer } = require('apollo-server-express');
const { authMiddleware } = require('./utils/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Instantiate the Apollo Server and applyMiddleware to it.
const server = new ApolloServer({
	typeDefs,
	resolvers,
	context: authMiddleware,
});
server.applyMiddleware({ app });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// if we're in production, serve client/build as static assets
if (process.env.NODE_ENV === 'production') {
	app.use(express.static(path.join(__dirname, '../client/build')));
}

db.once('open', () => {
	app.listen(PORT, () => {
		console.log(`🌍 Now listening on localhost:${PORT}`);
		console.log(`Use GraphQL at http://localhost:${PORT}${server.graphqlPath}`);
	});
});
