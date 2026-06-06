import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { apiRoutes } from "./routes";

export const app = express();

const allowedOrigin = (() => {
  try {
    return new URL(env.CLIENT_URL).origin;
  } catch {
    return env.CLIENT_URL;
  }
})();

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
