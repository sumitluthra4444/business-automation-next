"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";


type Ad = {
  id: string;
  title: string;
  image_url: string | null;
  video_url: string | null;
  is_active: boolean;
  created_at: string;
};

export default function AdsAdminPage({
  params
}: {
  params: { shopId: string };
}) {
  const shopId = params.shopId;

  const [ads, setAds] = useState<Ad[]>([]);
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<"image" | "video" | "text">("image");

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/admin/ads?shopId=${shopId}`, {
      cache: "no-store"
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Failed to load ads");
    setAds(json.ads || []);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, [shopId]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function safeName(original: string) {
    const clean = original.replace(/[^a-zA-Z0-9._-]/g, "_");
    const ts = Date.now();
    return `${shopId}/${ts}_${clean}`;
  }

  async function uploadToStorage(selected: File): Promise<string> {
    // bucket must exist: "ads" (public)
    const path = safeName(selected.name);

    const { error } = await supabase.storage.from("ads").upload(path, selected, {
      cacheControl: "3600",
      upsert: true,
      contentType: selected.type || undefined
    });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data } = supabase.storage.from("ads").getPublicUrl(path);
    const publicUrl = data?.publicUrl;
    if (!publicUrl) throw new Error("Could not generate public URL");
    return publicUrl;
  }

  async function addAd() {
    try {
      setLoading(true);
      setErr(null);
      setOk(null);

      let imageUrl = "";
      let videoUrl = "";

      if (mode === "image" || mode === "video") {
        if (!file) throw new Error("Please choose a file first.");

        const url = await uploadToStorage(file);

        if (mode === "image") imageUrl = url;
        if (mode === "video") videoUrl = url;
      }

      if (mode === "text" && !title.trim()) {
        throw new Error("Please enter a title for a text ad.");
      }

      const res = await fetch(`/api/admin/ads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          title: title.trim(),
          imageUrl: imageUrl || "",
          videoUrl: videoUrl || ""
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to add ad");

      setTitle("");
      setFile(null);
      setOk("Ad added ✅");
      await load();

      setTimeout(() => setOk(null), 1800);
    } catch (e: any) {
      setErr(
  typeof e?.message === "string"
    ? e.message
    : typeof e === "string"
    ? e
    : JSON.stringify(e)
);

    } finally {
      setLoading(false);
    }
  }

  async function toggle(id: string, is_active: boolean) {
    try {
      setErr(null);
      const res = await fetch(`/api/admin/ads`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to update ad");
      await load();
    } catch (e: any) {
      setErr(
  typeof e?.message === "string"
    ? e.message
    : typeof e === "string"
    ? e
    : JSON.stringify(e)
);

    }
  }

  return (
    <main style={page}>
      <div style={{ width: "100%", maxWidth: 980 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-end" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "2rem" }}>Ads Admin</h1>
            <p style={{ opacity: 0.75, marginTop: 8 }}>
              Shop: <b>{shopId}</b>
            </p>
          </div>

          <a href={`/tv/${shopId}`} style={{ ...btn, textDecoration: "none", padding: "12px 14px" }}>
            Open TV →
          </a>
        </div>

        {err && (
          <div style={errorBox}>
            <b>Error:</b> {err}
          </div>
        )}
        {ok && <div style={okBox}>{ok}</div>}

        <div style={card}>
          <div style={{ fontWeight: 950, marginBottom: 10 }}>Add new Ad</div>

          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  setMode("image");
                  setFile(null);
                }}
                style={{ ...pill, ...(mode === "image" ? pillOn : {}) }}
                type="button"
              >
                Image
              </button>
              <button
                onClick={() => {
                  setMode("video");
                  setFile(null);
                }}
                style={{ ...pill, ...(mode === "video" ? pillOn : {}) }}
                type="button"
              >
                Video
              </button>
              <button
                onClick={() => {
                  setMode("text");
                  setFile(null);
                }}
                style={{ ...pill, ...(mode === "text" ? pillOn : {}) }}
                type="button"
              >
                Text only
              </button>
            </div>

            <input
              placeholder="Ad title (optional for image/video, required for text ads)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={input}
            />

            {(mode === "image" || mode === "video") && (
              <div style={{ display: "grid", gap: 10 }}>
                <input
                  type="file"
                  accept={mode === "image" ? "image/*" : "video/*"}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  style={fileInput}
                />

                {previewUrl && mode === "image" && (
                  <img
                    src={previewUrl}
                    alt="preview"
                    style={{
                      width: "100%",
                      maxHeight: 260,
                      objectFit: "cover",
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.10)"
                    }}
                  />
                )}

                {previewUrl && mode === "video" && (
                  <video
                    src={previewUrl}
                    controls
                    style={{
                      width: "100%",
                      maxHeight: 260,
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.10)"
                    }}
                  />
                )}

                <div style={{ opacity: 0.65, fontSize: 13 }}>
                  Upload goes to Supabase Storage bucket: <b>ads</b> (public).
                </div>
              </div>
            )}

            <button
              onClick={addAd}
              disabled={
                loading ||
                (mode === "text" ? title.trim().length < 2 : !file)
              }
              style={{
                ...btn,
                opacity:
                  loading ||
                  (mode === "text" ? title.trim().length < 2 : !file)
                    ? 0.5
                    : 1
              }}
            >
              {loading ? "Uploading..." : "Add Ad"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 18, marginBottom: 10, opacity: 0.8 }}>
          Existing Ads
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {ads.map((a) => (
            <div key={a.id} style={row}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 950 }}>{a.title || "(no title)"}</div>

                <div style={{ opacity: 0.7, marginTop: 6, wordBreak: "break-all" }}>
                  {a.video_url
                    ? `VIDEO: ${a.video_url}`
                    : a.image_url
                    ? `IMAGE: ${a.image_url}`
                    : "TEXT AD"}
                </div>
              </div>

              <button
                onClick={() => toggle(a.id, !a.is_active)}
                style={{
                  ...btn,
                  background: a.is_active
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(77,163,255,0.22)",
                  border: a.is_active
                    ? "1px solid rgba(255,255,255,0.18)"
                    : "1px solid rgba(77,163,255,0.45)"
                }}
              >
                {a.is_active ? "Disable" : "Enable"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#0b0b0b",
  color: "white",
  display: "flex",
  justifyContent: "center",
  padding: "32px 16px",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto"
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  padding: 18,
  borderRadius: 18,
  marginTop: 16
};

const row: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  padding: 16,
  borderRadius: 18,
  display: "flex",
  gap: 12,
  alignItems: "center"
};

const input: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: "12px 14px",
  color: "white",
  outline: "none"
};

const fileInput: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 14,
  padding: "12px 14px",
  color: "white"
};

const btn: React.CSSProperties = {
  background: "rgba(77,163,255,0.22)",
  border: "1px solid rgba(77,163,255,0.45)",
  color: "#e6f2ff",
  padding: "12px 14px",
  borderRadius: 14,
  fontWeight: 950,
  cursor: "pointer",
  whiteSpace: "nowrap"
};

const pill: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "white",
  padding: "8px 12px",
  borderRadius: 999,
  fontWeight: 900,
  cursor: "pointer"
};

const pillOn: React.CSSProperties = {
  background: "rgba(77,163,255,0.20)",
  border: "1px solid rgba(77,163,255,0.40)"
};

const errorBox: React.CSSProperties = {
  background: "rgba(255,0,0,0.12)",
  border: "1px solid rgba(255,0,0,0.25)",
  padding: 14,
  borderRadius: 16,
  marginTop: 14
};

const okBox: React.CSSProperties = {
  background: "rgba(0,255,120,0.10)",
  border: "1px solid rgba(0,255,120,0.25)",
  padding: 14,
  borderRadius: 16,
  marginTop: 14
};
