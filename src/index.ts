// Bootstrap for go-date-web-app. The Forge AI layer adds domain handlers under
// src/service/ and the matching proto under proto/; this entrypoint and the
// health/metrics endpoints are fixed skeleton output.
import Fastify from "fastify";
import { healthz, metrics, readyz } from "./handlers.js";

const PORT = 8080;

const app = Fastify({ logger: true });

app.get("/healthz", async () => healthz());
app.get("/readyz", async () => readyz());
app.get("/metrics", async (_req, reply) => {
  reply.header("content-type", "text/plain");
  return metrics();
});

app
  .listen({ port: PORT, host: "0.0.0.0" })
  .then((addr) => app.log.info(`go-date-web-app listening on ${addr}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
