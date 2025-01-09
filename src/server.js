const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { json } = require('body-parser');
const { authMiddleware } = require('./middleware/authMiddleware');

// Import our components
const Book = require('./models/Book');
const BookService = require('./services/BookService');
const { typeDefs } = require('./schema/typeDefs');
const { createBookResolvers } = require('./resolvers/bookResolvers');

async function startServer() {
    const app = express();
    const httpServer = http.createServer(app);

    const bookService = new BookService();
    const resolvers = createBookResolvers(bookService);

    // Create Apollo Server
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req }) => {
            // Pass API key details to resolvers
            return {
                apiKeyDetails: req.apiKeyDetails
            };
        }
    });

    await server.start();

    // Apply middleware
    app.use(
        '/graphql',
        cors(),
        json(),
        authMiddleware, // Add authentication middleware
        expressMiddleware(server)
    );

    await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
    console.log(`🚀 Server ready at http://localhost:4000/graphql`);
}

startServer();