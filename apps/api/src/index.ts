// Read env varibles
require("dotenv").config("../");
import "reflect-metadata";

import { ApolloServer } from "apollo-server-express";
import express from "express";
import { createServer } from "http";
import { buildSchema } from "type-graphql";
import { scheduleSnapShots } from "./graphql/workers/snapshotWorker";
import CryptoCurrencyResolver from "./graphql/resolvers/CryptoCurrencyResolver";
import { pubsub } from "./graphql/pubsub";

// Connect to mongo database
require("./database/mongo");

(async function main() {
  const schema = await buildSchema({
    resolvers: [CryptoCurrencyResolver],
    emitSchemaFile: true,
  });

  const app = express();

  const apolloServer = new ApolloServer({
    schema,
    subscriptions: "/subs",
    context: (request) => {
      return {
        ...request,
        pubsub,
      };
    },
  });

  apolloServer.applyMiddleware({ app });
  const httpServer = createServer(app);

  apolloServer.installSubscriptionHandlers(httpServer);

  app.get("*", (req, res) =>
    res.json({ message: "Welcome to the Crypto Zone API" })
  );

  const PORT = process.env.PORT || 8000;
  httpServer.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
    scheduleSnapShots();
  });
})();
