import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  const isProduction = process.env.NODE_ENV === "production";
  const distPath = path.resolve(__dirname, 'dist');
  
  if (!isProduction) {
    console.log("Starting in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log(`Starting in production mode, serving from: ${distPath}`);
    
    // Serve static files with specific cache settings
    app.use(express.static(distPath, {
      maxAge: '1h',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));

    // SPA Fallback, but only for navigation requests
    app.get('*', (req, res) => {
      console.log(`[Request] ${req.method} ${req.url}`);
      
      // If it looks like an asset request that wasn't caught by express.static, log it as 404
      if (req.url.includes('/assets/') || req.url.includes('.')) {
        console.warn(`[404] Asset not found: ${req.url}`);
        return res.status(404).send('Not found');
      }
      
      console.log(`[SPA Fallback] Serving index.html for navigation to: ${req.url}`);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
