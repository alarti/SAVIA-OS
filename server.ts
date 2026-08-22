import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { handleAiChat, handleAiCommand, projectState, getCodebaseSummary } from "./server/ai/aiAgent";
import { PdfServerController } from "./server/pdf/pdfController";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security: Disable X-Powered-By header
  app.disable('x-powered-by');

  // JSON Body Parser for API requests (support up to 50MB for PDFs)
  app.use(express.json({ limit: "50mb" }));

  // Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // ==========================================
  // SAVIA PDF PRO 2 - Advanced PDF Engine APIs
  // ==========================================
  app.get("/api/pdf/health", (req, res) => PdfServerController.getHealth(req, res));
  app.post("/api/pdf/upload", (req, res) => PdfServerController.uploadPdf(req, res));
  app.post("/api/pdf/merge", (req, res) => PdfServerController.mergePdfs(req, res));
  app.post("/api/pdf/split", (req, res) => PdfServerController.splitPdf(req, res));

  // Web Proxy API Route with SSRF & Timeout Protection
  app.get("/api/proxy", async (req, res) => {
    let targetUrl = req.query.url as string;
    if (!targetUrl || typeof targetUrl !== "string") {
      return res.status(400).send("URL parameter is required");
    }

    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    // SSRF & URL Validation
    try {
      const parsed = new URL(targetUrl);
      const host = parsed.hostname.toLowerCase();

      // Block non-HTTP protocols
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return res.status(403).send("Protocol not allowed for security reasons");
      }

      // Block local/private IP ranges and Cloud Metadata endpoints
      const isPrivateOrLoopback = 
        host === "localhost" ||
        host === "127.0.0.1" ||
        host === "::1" ||
        host === "0.0.0.0" ||
        host === "169.254.169.254" || // Cloud Metadata Service
        /^127\./.test(host) ||
        /^10\./.test(host) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^169\.254\./.test(host);

      if (isPrivateOrLoopback) {
        return res.status(403).send("Security policy blocks access to local or internal networks");
      }
    } catch {
      return res.status(400).send("Invalid URL structure");
    }

    try {
      // 10-second request timeout to prevent hanging connections
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache"
        },
        redirect: "follow",
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get("content-type") || "";
      const finalUrl = response.url || targetUrl;

      // Set CORS headers safely
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

      if (contentType.includes("text/html")) {
        let html = await response.text();

        const baseTag = `<base href="${finalUrl}" target="_self">`;
        const scriptInjector = `
        <script>
          (function() {
            // Intercept link clicks so navigating stays inside the proxy
            document.addEventListener('click', function(e) {
              var anchor = e.target.closest('a');
              if (anchor && anchor.href && !anchor.href.startsWith('javascript:') && !anchor.href.startsWith('#')) {
                e.preventDefault();
                window.location.href = '/api/proxy?url=' + encodeURIComponent(anchor.href);
              }
            }, true);

            // Intercept form submissions
            document.addEventListener('submit', function(e) {
              var form = e.target;
              if (form && form.action) {
                var actionUrl = new URL(form.action, document.baseURI).href;
                if (!form.method || form.method.toLowerCase() === 'get') {
                  e.preventDefault();
                  var formData = new FormData(form);
                  var params = new URLSearchParams(formData).toString();
                  var fullUrl = actionUrl + (actionUrl.includes('?') ? '&' : '?') + params;
                  window.location.href = '/api/proxy?url=' + encodeURIComponent(fullUrl);
                }
              }
            }, true);
          })();
        </script>
        `;

        if (html.includes("<head>")) {
          html = html.replace("<head>", `<head>${baseTag}${scriptInjector}`);
        } else if (html.includes("<HEAD>")) {
          html = html.replace("<HEAD>", `<HEAD>${baseTag}${scriptInjector}`);
        } else {
          html = baseTag + scriptInjector + html;
        }

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(html);
      } else {
        // For images, CSS, JS, JSON, etc.
        if (contentType) {
          res.setHeader("Content-Type", contentType);
        }
        const arrayBuffer = await response.arrayBuffer();
        return res.status(response.status).send(Buffer.from(arrayBuffer));
      }
    } catch (error: any) {
      console.error("Proxy error:", error?.message || error);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Error Proxy Savia OS Security</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 3rem 1rem; background: #0f172a; color: #f8fafc; text-align: center; margin: 0; }
            .card { max-width: 520px; margin: 0 auto; background: #1e293b; padding: 2.5rem 2rem; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
            h2 { color: #f43f5e; margin-top: 0; font-size: 1.25rem; font-weight: 700; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.5; }
            code { display: inline-block; background: #0f172a; padding: 6px 12px; border-radius: 8px; font-family: monospace; color: #38bdf8; word-break: break-all; border: 1px solid #334155; margin: 8px 0; }
            .badge { display: inline-block; background: #f43f5e22; color: #f43f5e; border: 1px solid #f43f5e44; padding: 4px 12px; font-size: 12px; font-weight: 600; margin-bottom: 12px; border-radius: 9999px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">Savia OS Proxy Shield</div>
            <h2>Conexión No Disponible o Bloqueada</h2>
            <p>El sitio web no pudo responder dentro del tiempo límite o la solicitud violó la política de seguridad:</p>
            <p><code>${targetUrl}</code></p>
            <p style="font-size: 12px; color: #64748b; margin-top: 1.5rem;">Detalle del sistema: ${error?.name === 'AbortError' ? 'Tiempo de espera agotado (Timeout 10s)' : (error?.message || 'Error de red')}</p>
          </div>
        </body>
        </html>
      `);
    }
  });

  // ==========================================
  // SAVIA-OS AI Management Layer API Routes
  // ==========================================

  // 1. AI Chat Endpoint
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      const reply = await handleAiChat(message, history || []);
      return res.json({ reply, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      return res.status(500).json({
        error: "Error processing AI request",
        details: error?.message || String(error),
      });
    }
  });

  // 2. AI Slash Command Endpoint (/ai plan-sprint, /ai review-pr, etc.)
  app.post("/api/ai/command", async (req, res) => {
    try {
      const { command, args, context } = req.body;
      if (!command || typeof command !== "string") {
        return res.status(400).json({ error: "Command is required" });
      }

      const response = await handleAiCommand(command, args || "", context);
      return res.json(response);
    } catch (error: any) {
      console.error("AI Command Error:", error);
      return res.status(500).json({
        error: "Error executing AI command",
        details: error?.message || String(error),
      });
    }
  });

  // 3. Project State & Sprint Backlog Endpoint
  app.get("/api/ai/project-state", (req, res) => {
    return res.json(projectState);
  });

  // 4. Create or Update Project Task Endpoint
  app.post("/api/ai/tasks", (req, res) => {
    try {
      const { task } = req.body;
      if (!task || !task.title) {
        return res.status(400).json({ error: "Valid task object is required" });
      }

      const existingIndex = projectState.tasks.findIndex((t) => t.id === task.id);
      if (existingIndex >= 0) {
        projectState.tasks[existingIndex] = { ...projectState.tasks[existingIndex], ...task };
      } else {
        const newTask = {
          id: task.id || `TASK-${Math.floor(100 + Math.random() * 900)}`,
          title: task.title,
          description: task.description || "",
          module: task.module || "ui",
          priority: task.priority || "medium",
          status: task.status || "todo",
          storyPoints: task.storyPoints || 3,
          assignee: task.assignee || "AI Agent",
          githubIssueNumber: task.githubIssueNumber,
        };
        projectState.tasks.unshift(newTask);
      }

      return res.json({ success: true, state: projectState });
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to update project task", details: error?.message });
    }
  });

  // 5. Codebase Summary & Knowledge Graph Endpoint
  app.get("/api/ai/codebase-summary", (req, res) => {
    return res.json(getCodebaseSummary());
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
