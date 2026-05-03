import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("Checking for dist folder...");
  const isProduction = true; // Force production for serving the built assets
  const distPath = path.resolve(__dirname, 'dist');
  
  if (isProduction) {
    console.log(`Serving static files from: ${distPath}`);
    
    // Serve assets folder with long cache
    app.use('/assets', express.static(path.join(distPath, 'assets'), {
      immutable: true,
      maxAge: '1y'
    }));

    // Serve other static files
    app.use(express.static(distPath, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));

    app.get('*', (req, res) => {
      // Avoid infinite loops for missing assets
      if (req.url.startsWith('/assets/')) {
        return res.status(404).send('Asset not found');
      }
      console.log(`[SPA Fallback] Serving index.html for ${req.url}`);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // ... rest of the vite middleware logic if needed, but we're forcing prod
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
