import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import https from "https";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON & URL-encoded parser for uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Ensure public/audio_uploads exists
  const audioUploadsDir = path.join(process.cwd(), "public", "audio_uploads");
  if (!fs.existsSync(audioUploadsDir)) {
    fs.mkdirSync(audioUploadsDir, { recursive: true });
  }
  app.use("/audio_uploads", express.static(audioUploadsDir));

  // Audio upload route (supports base64 audio payload)
  app.post("/api/upload-audio", async (req, res) => {
    try {
      const { name, base64 } = req.body;
      if (!name || !base64) {
        return res.status(400).json({ error: "Missing audio name or base64 data" });
      }

      const safeName = `${Date.now()}_${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const filePath = path.join(audioUploadsDir, safeName);
      const cleanBase64 = base64.replace(/^data:audio\/\w+;base64,/, "");
      
      await fs.promises.writeFile(filePath, Buffer.from(cleanBase64, "base64"));
      const publicUrl = `/audio_uploads/${safeName}`;
      return res.json({ url: publicUrl, name: safeName, originalName: name });
    } catch (err: any) {
      console.error("Audio upload error:", err);
      return res.status(500).json({ error: err.message || "Failed to upload audio" });
    }
  });

  // Audio proxy route
  app.get("/api/audio", (req, res) => {
    const fileId = "1lvBh8599MercSHmw_EzeniCP39vMbFFG";
    const googleDriveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    const proxyRequest = (url: string) => {
      https.get(url, (response) => {
        // Handle redirect
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 303) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            proxyRequest(redirectUrl);
            return;
          }
        }
        
        // Pipe headers
        if (response.headers['content-type']) res.setHeader('Content-Type', response.headers['content-type']);
        if (response.headers['content-length']) res.setHeader('Content-Length', response.headers['content-length']);
        if (response.headers['accept-ranges']) res.setHeader('Accept-Ranges', response.headers['accept-ranges']);
        if (response.headers['content-range']) res.setHeader('Content-Range', response.headers['content-range']);
        
        // Important to remove CORS/CORP headers from google drive that block cross origin embedding
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        
        res.status(response.statusCode || 200);
        response.pipe(res);
      }).on('error', (err) => {
        console.error('Error proxying audio:', err);
        res.status(500).end('Internal server error');
      });
    };
    
    proxyRequest(googleDriveUrl);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
