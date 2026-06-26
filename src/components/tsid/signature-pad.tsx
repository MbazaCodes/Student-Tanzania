import { useRef, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Eraser, Upload, Loader2, Check } from "lucide-react";

/**
 * Signature capture: draw on a canvas OR upload an image.
 * Uploads the result to the `profiles` bucket and returns the public URL.
 */
export function SignaturePad({ pathPrefix, currentUrl, onSaved }: {
  pathPrefix: string;            // e.g. `schools/IR8557/signature`
  currentUrl?: string | null;
  onSaved: (url: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(currentUrl ?? null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#0a1f44";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function pos(e: React.PointerEvent) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  }
  function start(e: React.PointerEvent) {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.beginPath(); ctx.moveTo(p.x, p.y);
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y); ctx.stroke();
    setHasInk(true);
  }
  function end() { drawing.current = false; }

  function clear() {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    setHasInk(false);
  }

  async function uploadBlob(blob: Blob, ext: string) {
    setUploading(true);
    try {
      const path = `${pathPrefix}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("profiles").upload(path, blob, { cacheControl: "3600", upsert: true });
      if (error) { toast.error(error.message); setUploading(false); return; }
      const { data } = supabase.storage.from("profiles").getPublicUrl(path);
      setSavedUrl(data.publicUrl);
      onSaved(data.publicUrl);
      toast.success("Signature saved");
    } catch (err) { toast.error(String(err)); }
    setUploading(false);
  }

  async function saveDrawing() {
    const c = canvasRef.current!;
    c.toBlob((blob) => { if (blob) uploadBlob(blob, "png"); }, "image/png");
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    const ext = file.name.split(".").pop() || "png";
    await uploadBlob(file, ext);
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      {savedUrl && (
        <div className="flex items-center gap-2 text-xs text-emerald-600">
          <Check className="h-3.5 w-3.5" /> Signature saved
          <img src={savedUrl} alt="signature" className="h-8 border rounded bg-white ml-2" />
        </div>
      )}
      <div className="rounded-lg border bg-white">
        <canvas
          ref={canvasRef}
          width={500}
          height={160}
          className="w-full touch-none rounded-lg"
          style={{ cursor: "crosshair" }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Button type="button" size="sm" variant="outline" onClick={clear}>
          <Eraser className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
        <Button type="button" size="sm" onClick={saveDrawing} disabled={!hasInk || uploading} className="bg-primary">
          {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
          Save signature
        </Button>
        <label className="text-xs text-muted-foreground cursor-pointer inline-flex items-center gap-1 px-2 py-1.5 rounded border hover:bg-muted">
          <Upload className="h-3.5 w-3.5" /> or upload image
          <input type="file" accept="image/*" className="hidden" onChange={uploadFile} />
        </label>
      </div>
    </div>
  );
}
