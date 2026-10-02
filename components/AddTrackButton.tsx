"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

type Status = "idle" | "sending" | "done" | "error";

export default function AddTrackButton() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function reset() {
    setUrl("");
    setTitle("");
    setArtist("");
    setStatus("idle");
    setErrorMsg("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/queue-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title, artist }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Échec de l'envoi");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="press-tactile w-11 h-11 rounded-full bg-surface shadow-raised-sm flex items-center justify-center text-text shrink-0"
        aria-label="Ajouter un titre"
      >
        <Plus size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-scrim">
          <div className="w-full max-w-md bg-base rounded-t-2xl p-6 pb-10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-title-3 font-semibold text-text">Ajouter un titre</h2>
              <button
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="p-2 text-muted"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            {status === "done" ? (
              <div className="space-y-4">
                <p className="text-text">
                  Envoyé — ce titre sera ajouté la prochaine fois que tu lances{" "}
                  <code className="text-text">npm run studio</code> sur ton Mac.
                </p>
                <button
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                  className="press-tactile w-full py-3 rounded-control bg-accent text-accent-text font-medium"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="url"
                  required
                  placeholder="Lien YouTube"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-control bg-inset shadow-inset-sm text-text placeholder:text-tertiary"
                />
                <input
                  type="text"
                  required
                  placeholder="Titre du morceau"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-control bg-inset shadow-inset-sm text-text placeholder:text-tertiary"
                />
                <input
                  type="text"
                  required
                  placeholder="Nom de l'artiste"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full px-4 py-3 rounded-control bg-inset shadow-inset-sm text-text placeholder:text-tertiary"
                />
                {status === "error" && <p className="text-red text-footnote">{errorMsg}</p>}
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="press-tactile w-full py-3 rounded-control bg-accent text-accent-text font-medium disabled:opacity-50"
                >
                  {status === "sending" ? "Envoi…" : "Ajouter à la file"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
