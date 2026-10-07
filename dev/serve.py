"""Serveur de test local : imite Vercel (cleanUrls) et simule /api/contact sans Supabase.

Lancer :  python dev/serve.py   puis ouvrir http://localhost:4321
Les demandes envoyées via le formulaire sont écrites dans dev/submissions.jsonl.
"""
import json
import os
import re
import sys
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).resolve().parent.parent
LOG = Path(__file__).resolve().parent / "submissions.jsonl"
PORT = int(os.environ.get("PORT", "4321"))
FIELDS = {"nom": 120, "societe": 160, "email": 200, "telephone": 40, "type_projet": 120, "message": 5000, "page": 200}
HIDDEN = {"CLAUDE.md", "supabase", ".env.example", "dev", ".git"}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _hidden(self, path):
        first = path.strip("/").split("/")[0]
        return first in HIDDEN

    def do_GET(self):
        parts = urlsplit(self.path)
        path = parts.path
        if self._hidden(path):
            return self.send_error(404)
        # cleanUrls : /page.html -> /page (308), /page -> page.html
        if path.endswith(".html"):
            clean = "/" if path == "/index.html" else path[:-5]
            self.send_response(308)
            self.send_header("Location", clean + (("?" + parts.query) if parts.query else ""))
            self.end_headers()
            return
        if path != "/" and not Path(ROOT, path.lstrip("/")).exists() and Path(ROOT, path.lstrip("/") + ".html").exists():
            self.path = path + ".html" + (("?" + parts.query) if parts.query else "")
        return super().do_GET()

    def do_POST(self):
        if urlsplit(self.path).path != "/api/contact":
            return self.send_error(404)
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length).decode("utf-8", "replace")
        ctype = self.headers.get("Content-Type", "")
        if "application/json" in ctype:
            body = json.loads(raw or "{}")
        else:
            body = {k: v[0] for k, v in parse_qs(raw).items()}
        wants_json = "application/json" in self.headers.get("Accept", "")

        def reply(status, payload):
            if not wants_json and status == 200:
                self.send_response(303)
                self.send_header("Location", "/?envoye=1#contact")
                self.end_headers()
                return
            data = json.dumps(payload).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        if str(body.get("site_web", "")).strip():
            print("[api/contact] robot détecté (champ piège rempli), ignoré")
            return reply(200, {"ok": True})
        row = {k: str(body.get(k, "")).strip()[:m] for k, m in FIELDS.items()}
        if not row["nom"] or not row["email"] or not row["message"]:
            return reply(400, {"error": "Merci de compléter votre nom, votre e-mail et votre projet."})
        if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", row["email"]):
            return reply(400, {"error": "L'adresse e-mail ne semble pas valide."})
        row["created_at"] = datetime.now(timezone.utc).isoformat()
        with LOG.open("a", encoding="utf-8") as f:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
        print("[api/contact] demande reçue (simulation, pas de Supabase) :", json.dumps(row, ensure_ascii=False))
        return reply(200, {"ok": True})

    def log_message(self, fmt, *args):
        sys.stderr.write("%s\n" % (fmt % args))


if __name__ == "__main__":
    print(f"Yvelec preview locale : http://localhost:{PORT}")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
