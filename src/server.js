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
     
     const server = new ApolloServer({
        typeDefs,
        resolvers,
        formatError: (err) => {
            // Handle GraphQL validation errors for inputs
            //console.log('Error:', err);
            if (err.extensions?.code === 'BAD_USER_INPUT' || 
                err.message.includes('Variable "$bookInput"')) {
                return {
                    message: 'Book creation requires valid input data',
                    code: 'VALIDATION_ERROR',
                    field: 'bookInput'
                };
            }
            
            const error = err.originalError || err;
            return {
                message: error.message,
                code: error.extensions?.code || error.code || 'INTERNAL_ERROR',
                field: error.extensions?.field || error.field
            };
        },
        context: ({ req, res }) => ({
            apiKeyDetails: req.apiKeyDetails,
            req,
            res
        })
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