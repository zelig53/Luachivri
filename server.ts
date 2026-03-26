import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { OAuth2Client } from "google-auth-library";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.APP_URL || "http://localhost:3000";

const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${APP_URL}/auth/google/callback`
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // OAuth Routes
  app.get("/api/auth/google/url", (req, res) => {
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/tasks.readonly",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      prompt: "consent",
    });
    res.json({ url });
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      
      // In a real app, we'd store this in a secure session/DB
      // For this demo, we'll pass it back to the client via a cookie (not ideal for production but works for the prototype)
      res.cookie("google_tokens", JSON.stringify(tokens), {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. Closing window...</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("OAuth Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.get("/api/auth/status", (req, res) => {
    const tokens = req.cookies.google_tokens;
    res.json({ isAuthenticated: !!tokens });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("google_tokens");
    res.json({ success: true });
  });

  // Google API Proxies
  app.get("/api/google/calendar/events", async (req, res) => {
    const tokensStr = req.cookies.google_tokens;
    if (!tokensStr) return res.status(401).json({ error: "Unauthorized" });
    
    const tokens = JSON.parse(tokensStr);
    oauth2Client.setCredentials(tokens);

    try {
      const url = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
      const response = await oauth2Client.request({ url });
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch calendar" });
    }
  });

  app.get("/api/google/tasks", async (req, res) => {
    const tokensStr = req.cookies.google_tokens;
    if (!tokensStr) return res.status(401).json({ error: "Unauthorized" });
    
    const tokens = JSON.parse(tokensStr);
    oauth2Client.setCredentials(tokens);

    try {
      // First get tasklists
      const tasklistsRes = await oauth2Client.request({ 
        url: "https://www.googleapis.com/tasks/v1/users/@me/lists" 
      });
      const lists = (tasklistsRes.data as any).items || [];
      
      // Fetch tasks from all lists (simplified for demo)
      const allTasks = [];
      for (const list of lists) {
        const tasksRes = await oauth2Client.request({ 
          url: `https://www.googleapis.com/tasks/v1/lists/${list.id}/tasks` 
        });
        allTasks.push(...((tasksRes.data as any).items || []));
      }
      
      res.json({ items: allTasks });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
