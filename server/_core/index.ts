import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { startBatchScheduler } from "../batch/scheduler";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3101): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  // Image proxy for YouTube thumbnails (avoids CORS/CSP issues in preview)
  app.get("/api/image-proxy", async (req, res) => {
    const url = req.query.url as string;
    if (!url || !url.startsWith('https://i.ytimg.com/')) {
      res.status(400).json({ error: 'Invalid URL' });
      return;
    }
    try {
      const response = await fetch(url);
      if (!response.ok) { res.status(response.status).end(); return; }
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch {
      res.status(500).json({ error: 'Proxy failed' });
    }
  });

  // Static JSON data endpoint (Cloudflare Pages互換)
  // public/data/{news,social,market,meta}.json を配信
  app.use("/data", express.static(
    path.resolve(__dirname, "../../public/data"),
    { maxAge: '2m', setHeaders: (res) => { res.setHeader('Access-Control-Allow-Origin', '*'); } }
  ));

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3101");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
    // 静的JSON定期生成を開始
    startBatchScheduler();
  });
}

startServer().catch(console.error);
