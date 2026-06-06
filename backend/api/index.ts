import { app } from "../src/app";
import { connectDb } from "../src/config/db";

let dbReady: Promise<void> | null = null;

const ensureDb = () => {
  dbReady ??= connectDb();
  return dbReady;
};

export default async function handler(req: unknown, res: unknown) {
  await ensureDb();
  return app(req as never, res as never);
}
