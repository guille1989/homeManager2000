import { app } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";

const bootstrap = async () => {
  await connectDb();

  app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
  });
};

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});

