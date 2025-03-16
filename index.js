import express from "express";
import http from "http";
import cors from "cors";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

import mergedResolvers from "./resolvers/index.js";
import mergedTypeDefs from "./typeDefs/index.js";
import job from "./cron.js";

job.start();

const app = express();
const httpServer = http.createServer(app);

const server = new ApolloServer({
  typeDefs: mergedTypeDefs,
  resolvers: mergedResolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  csrfPrevention: true,
  cache: "bounded",
  introspection: true,
  formatError: (error) => {
    console.error('GraphQL Error:', error);
    return error;
  },
});

await server.start();

const corsOptions = {
  origin: [
    "https://shishyakul.in",
    "https://www.shishyakul.in",
    "https://shishyakul.vercel.app",
    "http://localhost:3000",
    "https://shishyakul-git-pre-deploy-hetrefs-projects.vercel.app"
  ],
  credentials: true, // This allows cookies to be sent from the client
};

app.use(
  "/",
  cors(corsOptions),
  express.json({ limit: '50mb' }),
  expressMiddleware(server, {
    context: async ({ req }) => ({ req }),
  })
);

await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));

console.log(`🚀 Server ready at http://localhost:4000/`);
