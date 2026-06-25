import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";

/**
 * Profile photo uploader. Uploads to the public `profiles` bucket and returns
 * the public URL via onUploaded. Used for student photos and school logos.
 */
export function PhotoUpload({ currentUrl, pathPrefix, onUploaded, shape = "portrait", label = "Upload photo" }: {
  currentUrl?: string | null;
  pathPrefix: string;          // e.g. `students/TSID-2026-XXXX` or `schools/IR8557`
  onUploaded: (url: string) => void;
  shape?: "portrait" | "square";
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${pathPrefix}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("profiles").upload(path, file, {
        cacheControl: "3600", upsert: true,
      });
      if (error) { toast.error(error.message); setUploading(false); return; }
      const { data } = supabase.storage.from("profiles").getPublicUrl(path);
      setPreview(data.publicUrl);
      onUploaded(data.publicUrl);
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(String(err));
    }
    setUploading(false);
    e.target.value = "";
  }

  const dims = shape === "portrait" ? "w-24 h-32" : "w-24 h-24";
  const radius = shape === "portrait" ? "rounded-lg" : "rounded-full";

  return (
    <div className="flex items-center gap-4">
      <div className={`${dims} ${radius} border bg-muted flex items-center justify-center overflow-hidden shrink-0`}>
        {preview
          ? <img src={preview} alt="" className="w-full h-full object-cover" />
          : <Camera className="h-6 w-6 text-muted-foreground" />}
      </div>
      <label className="inline-flex">
        <input type="file" accept="image/*" onChange={handle} className="hidden" disabled={uploading} />
        <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer border ${uploading ? "bg-muted text-muted-foreground" : "bg-card hover:bg-muted/50"}`}>
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          {uploading ? "Uploading…" : label}
        </span>
      </label>
    </div>
  );
}
