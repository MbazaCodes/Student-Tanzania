import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/student/applications")({ component: Page });

function Page() {
  const me = useCurrentUser();
  const qc = useQueryClient();
  const [type, setType] = useState("utambulisho");
  const [reason, setReason] = useState("");
  const [addressee, setAddressee] = useState("");

  const { data: student } = useQuery({
    enabled: !!me.tsid,
    queryKey: ["my-student-min", me.tsid],
    queryFn: async () => (await supabase.from("students").select("tsid,fullname,school_code,school_name").eq("tsid", me.tsid!).maybeSingle()).data,
  });

  const { data: letters = [] } = useQuery({
    enabled: !!me.tsid,
    queryKey: ["my-letters", me.tsid],
    queryFn: async () => (await supabase.from("request_letters").select("ref,type,reason,status,requested_at").eq("tsid", me.tsid!).order("requested_at", { ascending: false })).data ?? [],
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!student) return;
    const { error } = await supabase.from("request_letters").insert({
      tsid: student.tsid, student_name: student.fullname,
      school_code: student.school_code, school_name: student.school_name ?? "",
      type, reason: reason || null, addressee: addressee || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Letter requested"); setReason(""); setAddressee(""); qc.invalidateQueries({ queryKey: ["my-letters"] }); }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>Letter Requests</h1>
      {student ? (
        <form onSubmit={submit} className="rounded-2xl border bg-card p-5 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="utambulisho">Utambulisho</SelectItem>
                  <SelectItem value="transfer">School transfer</SelectItem>
                  <SelectItem value="bonafide">Bonafide</SelectItem>
                  <SelectItem value="character_reference">Character reference</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Addressee</Label><Input value={addressee} onChange={(e) => setAddressee(e.target.value)} placeholder="To whom it may concern" /></div>
            <div className="md:col-span-2"><Label>Reason</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          </div>
          <Button type="submit">Submit request</Button>
        </form>
      ) : <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="rounded-2xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Status</th></tr>
          </thead>
          <tbody>
            {letters.map((l) => (
              <tr key={l.ref} className="border-t">
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(l.requested_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 capitalize">{l.type}</td>
                <td className="px-4 py-3 text-sm">{l.reason ?? "—"}</td>
                <td className="px-4 py-3 capitalize">{l.status}</td>
              </tr>
            ))}
            {letters.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No requests yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}