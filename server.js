const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { createServer } = require('http');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { PubSub } = require('graphql-subscriptions');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const winston = require('winston');
const rateLimit = require('express-rate-limit');
const { applyMiddleware } = require('graphql-middleware');

const typeDefs = require('./src/graphql/schema/typeDefs');
const resolvers = require('./src/graphql/schema/resolvers');
const { logger } = require('./src/config/logger');
const { connectDB } = require('./src/config/database');
const { authMiddleware } = require('./src/middleware/auth');
const { complexityLimit } = require('./src/middleware/complexityLimit');
const { createRateLimitRule } = require('./src/middleware/rateLimit');
const { formatError } = require('./src/utils/errorHandler');

require('dotenv').config();

const pubsub = new PubSub();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // Connect to MongoDB
  await connectDB();

  // Create Schema
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // Updated WebSocket server configuration
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
    handleProtocols: (protocols, req) => {
      // Accept graphql-transport-ws protocol
      return protocols.includes('graphql-transport-ws') 
        ? 'graphql-transport-ws' 
        : false;
    },
  });

  const serverCleanup = useServer({
    schema,
    context: async (ctx, msg, args) => {
      if (msg.type === 'connection_init') {
        const token = msg.payload?.Authorization || ctx.connectionParams?.Authorization;
        logger.info('WebSocket connection initialized');
        return {
          pubsub,
        };
      }
      return {
        pubsub,
      };
    },
    onConnect: async (ctx) => {
      logger.info('Client connected to WebSocket');
      return true;
    },
    onDisconnect: async (ctx) => {
      logger.info('Client disconnected from WebSocket');
    },
    onSubscribe: async (ctx, msg) => {
      logger.info('Client subscribed to:', msg.payload.query);
    },
    onNext: async (ctx, msg, args, result) => {
      logger.debug('Subscription event:', { msg, result });
    },
    onError: async (ctx, msg, errors) => {
      logger.error('Subscription error:', errors);
    },
    // Add keepAlive configuration
    keepAlive: 12000, // Send keep-alive every 12 seconds
  }, wsServer);

  // Create Apollo Server
  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
    // Enable batching
    allowBatchedHttpRequests: true,
    context: async ({ req }) => ({
      user: req.user,
      pubsub,
      redis: new Redis(process.env.REDIS_URL),
      logger,
    }),
  });

  await server.start();

  // Apply middleware
  app.use(
    '/graphql',
    // rateLimit(createRateLimitRule()), // Comment this line
    express.json(),
    authMiddleware,
    expressMiddleware(server, {
      context: async ({ req }) => ({
        user: req.user,
        redis: new Redis(process.env.REDIS_URL),
        logger,
      }),
    })
  );

  // Add WebSocket heartbeat
  wsServer.on('connection', function connection(ws) {
    ws.isAlive = true;
    
    ws.on('pong', function heartbeat() {
      ws.isAlive = true;
    });
    
    // Send ping to keep connection alive
    const interval = setInterval(function ping() {
      if (ws.isAlive === false) {
        logger.info('Terminating inactive connection');
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    }, 30000);
    
    ws.on('close', function close() {
      clearInterval(interval);
    });
  });

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    logger.info(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    logger.info(`🚀 Subscriptions ready at ws://localhost:${PORT}/graphql`);
  });
}

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
});
