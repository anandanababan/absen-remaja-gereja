import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Principal } from "@icp-sdk/core/principal";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  Copy,
  Hash,
  Loader2,
  Lock,
  Plus,
  ShieldCheck,
  ShieldPlus,
  Unlock,
  UserCog,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Session, SessionId } from "../backend.d";
import { SessionStatus } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAssignAdminRole,
  useClaimFirstAdmin,
  useCloseSession,
  useCreateSession,
  useGetAllSessions,
  useGetSessionAttendees,
  useIsCallerAdmin,
  useIsFirstAdminClaimed,
} from "../hooks/useQueries";

function formatTime(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleString("id-ID", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function CopyPrincipalRow({ principal }: { principal: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(principal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-3 border border-border">
      <span className="font-mono text-xs text-foreground break-all flex-1 select-all">
        {principal}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded-lg p-1.5 hover:bg-primary/10 transition-colors"
        title="Salin Principal ID"
        data-ocid="admin.secondary_button"
      >
        {copied ? (
          <Check className="h-4 w-4 text-primary" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

function PinBadge({ pin }: { pin: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-primary/10 border border-primary/20 px-5 py-4 animate-pin-pulse">
      <span className="pin-display text-3xl font-bold text-primary tracking-widest">
        {pin}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="ml-auto rounded-lg p-2 hover:bg-primary/20 transition-colors"
        title="Salin PIN"
        data-ocid="admin.secondary_button"
      >
        {copied ? (
          <Check className="h-4 w-4 text-primary" />
        ) : (
          <Copy className="h-4 w-4 text-primary" />
        )}
      </button>
    </div>
  );
}

function AttendeeView({
  sessionId,
  onBack,
  session,
}: {
  sessionId: SessionId;
  onBack: () => void;
  session: Session;
}) {
  const { data: attendees = [], isLoading } = useGetSessionAttendees(sessionId);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-xl"
          data-ocid="admin.secondary_button"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">
            {session.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {attendees.length} peserta hadir
          </p>
        </div>
      </div>

      {isLoading ? (
        <div
          className="flex justify-center py-12"
          data-ocid="admin.loading_state"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : attendees.length === 0 ? (
        <div
          className="text-center py-12 card-warm rounded-2xl"
          data-ocid="admin.empty_state"
        >
          <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Belum ada peserta yang absen</p>
        </div>
      ) : (
        <div className="card-warm rounded-2xl overflow-hidden">
          <Table data-ocid="admin.table">
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="font-semibold text-foreground w-10">
                  #
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Nama
                </TableHead>
                <TableHead className="font-semibold text-foreground text-right">
                  Waktu Absen
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendees.map((att, i) => (
                <TableRow
                  key={att.id.toString()}
                  className="border-border hover:bg-accent/50"
                  data-ocid={`admin.row.${i + 1}` as any}
                >
                  <TableCell className="text-muted-foreground text-sm">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {att.name}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatTime(att.timestamp)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
}

function SessionCard({
  session,
  index,
  onViewAttendees,
}: {
  session: Session;
  index: number;
  onViewAttendees: (s: Session) => void;
}) {
  const closeSession = useCloseSession();
  const isActive = session.status === SessionStatus.active;

  async function handleClose() {
    try {
      await closeSession.mutateAsync(session.id);
      toast.success(`Sesi "${session.title}" telah ditutup.`);
    } catch {
      toast.error("Gagal menutup sesi.");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="card-warm rounded-2xl p-5"
      data-ocid={`admin.item.${index + 1}` as any}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-foreground text-lg truncate">
            {session.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatTime(session.createdAt)}
            </span>
          </div>
        </div>
        <Badge
          className={`shrink-0 rounded-full text-xs font-semibold px-3 py-1 ${
            isActive
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : "bg-muted text-muted-foreground border-border"
          }`}
          variant="outline"
        >
          {isActive ? (
            <>
              <Unlock className="h-3 w-3 mr-1" />
              Aktif
            </>
          ) : (
            <>
              <Lock className="h-3 w-3 mr-1" />
              Tutup
            </>
          )}
        </Badge>
      </div>

      {isActive && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            PIN Sesi
          </p>
          <PinBadge pin={session.pin} />
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            <strong className="text-foreground">
              {session.attendeeCount.toString()}
            </strong>{" "}
            hadir
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewAttendees(session)}
            className="rounded-xl text-xs"
            data-ocid="admin.secondary_button"
          >
            Lihat Peserta
          </Button>
          {isActive && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClose}
              disabled={closeSession.isPending}
              className="rounded-xl text-xs"
              data-ocid="admin.delete_button"
            >
              {closeSession.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Tutup Sesi"
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CreateSessionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const createSession = useCreateSession();

  async function handleCreate() {
    if (!title.trim()) return;
    try {
      await createSession.mutateAsync(title.trim());
      setTitle("");
      onOpenChange(false);
      toast.success("Sesi baru berhasil dibuat! PIN tersedia di dashboard.");
    } catch {
      toast.error("Gagal membuat sesi.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm" data-ocid="admin.dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Buat Sesi Baru
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="session-title" className="text-sm font-semibold">
              Nama Sesi
            </Label>
            <Input
              id="session-title"
              placeholder="Contoh: Ibadah Remaja 15 Mar"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              data-ocid="admin.input"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            PIN 6 digit akan digenerate otomatis oleh sistem.
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
            data-ocid="admin.cancel_button"
          >
            Batal
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || createSession.isPending}
            className="btn-primary-warm text-primary-foreground rounded-xl"
            data-ocid="admin.confirm_button"
          >
            {createSession.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Membuat...
              </>
            ) : (
              "Buat Sesi"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManageAdminSection({
  currentPrincipal,
}: { currentPrincipal: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newAdminId, setNewAdminId] = useState("");
  const assignAdmin = useAssignAdminRole();

  async function handleAssign() {
    const trimmed = newAdminId.trim();
    if (!trimmed) return;
    try {
      const principal = Principal.fromText(trimmed);
      await assignAdmin.mutateAsync(principal);
      setNewAdminId("");
      toast.success("Principal berhasil ditambahkan sebagai admin!");
    } catch (e: any) {
      if (
        e?.message?.includes("Invalid principal") ||
        e?.message?.includes("Cannot parse")
      ) {
        toast.error("Format Principal ID tidak valid.");
      } else {
        toast.error("Gagal menambahkan admin.");
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="card-warm rounded-2xl overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/30 transition-colors"
        data-ocid="admin.toggle"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <UserCog className="h-4 w-4 text-primary" />
          </div>
          <span className="font-display font-semibold text-foreground text-sm">
            Kelola Admin
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="manage-admin-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5 border-t border-border">
              {/* Current principal */}
              <div className="space-y-1.5 pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Principal ID Kamu
                </p>
                <CopyPrincipalRow principal={currentPrincipal} />
              </div>

              {/* Add new admin */}
              <div className="space-y-2">
                <Label
                  htmlFor="new-admin-principal"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Tambah Admin Baru
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="new-admin-principal"
                    placeholder="Principal ID (contoh: aaaaa-bbbbb-...)"
                    value={newAdminId}
                    onChange={(e) => setNewAdminId(e.target.value)}
                    className="rounded-xl font-mono text-xs flex-1"
                    onKeyDown={(e) => e.key === "Enter" && handleAssign()}
                    data-ocid="admin.input"
                  />
                  <Button
                    onClick={handleAssign}
                    disabled={!newAdminId.trim() || assignAdmin.isPending}
                    className="btn-primary-warm text-primary-foreground rounded-xl shrink-0"
                    data-ocid="admin.primary_button"
                  >
                    {assignAdmin.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldPlus className="h-4 w-4 mr-1" />
                        Tambah
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Masukkan Principal ID yang ingin dijadikan admin, lalu klik
                  Tambah.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AdminPage() {
  const { login, loginStatus, identity, clear } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;
  const { data: isAdmin, isLoading: checkingAdmin } = useIsCallerAdmin();
  const { data: isFirstAdminClaimed, isLoading: checkingFirstAdmin } =
    useIsFirstAdminClaimed();
  const claimFirstAdmin = useClaimFirstAdmin();
  const { data: sessions = [], isLoading: loadingSessions } =
    useGetAllSessions();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const isLoggingIn = loginStatus === "logging-in";
  const currentPrincipal = identity?.getPrincipal().toText() ?? "";

  if (!isLoggedIn) {
    return (
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Panel Admin
          </h1>
          <p className="text-muted-foreground mb-8">
            Login untuk mengakses dashboard admin dan mengelola sesi absen.
          </p>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="btn-primary-warm text-primary-foreground w-full rounded-xl py-6 text-base font-semibold"
            data-ocid="admin.primary_button"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghubungkan...
              </>
            ) : (
              "Login dengan Internet Identity"
            )}
          </Button>
        </motion.div>
      </main>
    );
  }

  if (checkingAdmin) {
    return (
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div data-ocid="admin.loading_state">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    // Still checking whether first admin has been claimed
    if (checkingFirstAdmin) {
      return (
        <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div data-ocid="admin.loading_state">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      );
    }

    // No admin exists yet — allow this user to claim first admin
    if (isFirstAdminClaimed === false) {
      return (
        <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm space-y-4"
          >
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <ShieldPlus className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-display text-xl font-bold mb-1">
                Belum Ada Admin
              </h2>
              <p className="text-muted-foreground text-sm">
                Sistem belum memiliki admin. Jadilah yang pertama!
              </p>
            </div>

            <div className="card-warm rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Principal ID Kamu
              </p>
              <CopyPrincipalRow principal={currentPrincipal} />
              <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2.5">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-foreground/70 leading-relaxed">
                  Klik tombol di bawah untuk mendaftarkan akun ini sebagai admin
                  pertama sistem.
                </p>
              </div>
            </div>

            <Button
              onClick={async () => {
                try {
                  await claimFirstAdmin.mutateAsync();
                  toast.success(
                    "Berhasil! Kamu sekarang menjadi admin pertama.",
                  );
                } catch {
                  toast.error("Gagal mengklaim admin.");
                }
              }}
              disabled={claimFirstAdmin.isPending}
              className="btn-primary-warm text-primary-foreground w-full rounded-xl py-6 text-base font-semibold"
              data-ocid="admin.primary_button"
            >
              {claimFirstAdmin.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <ShieldPlus className="mr-2 h-5 w-5" />
                  Jadikan Saya Admin Pertama
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={clear}
              className="w-full rounded-xl"
              data-ocid="admin.secondary_button"
            >
              Keluar
            </Button>
          </motion.div>
        </main>
      );
    }

    // Admin already exists — show access denied with instructions
    return (
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-4"
          data-ocid="admin.error_state"
        >
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <ShieldCheck className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="font-display text-xl font-bold mb-1">
              Akses Ditolak
            </h2>
            <p className="text-muted-foreground text-sm">
              Akun ini tidak memiliki hak akses admin.
            </p>
          </div>

          <div className="card-warm rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Principal ID Kamu
            </p>
            <CopyPrincipalRow principal={currentPrincipal} />
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <ShieldPlus className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Minta admin yang sudah ada untuk menambahkan Principal ID kamu
                sebagai admin.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={clear}
            className="w-full rounded-xl"
            data-ocid="admin.secondary_button"
          >
            Keluar
          </Button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {selectedSession ? (
            <AttendeeView
              key={`attendees-${selectedSession.id}`}
              sessionId={selectedSession.id}
              session={selectedSession}
              onBack={() => setSelectedSession(null)}
            />
          ) : (
            <motion.div
              key="sessions-list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">
                    Dashboard Admin
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {sessions.length} sesi terdaftar
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clear}
                    className="rounded-xl text-xs"
                    data-ocid="admin.secondary_button"
                  >
                    Keluar
                  </Button>
                  <Button
                    onClick={() => setCreateOpen(true)}
                    className="btn-primary-warm text-primary-foreground rounded-xl text-sm font-semibold"
                    data-ocid="admin.primary_button"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Buat Sesi
                  </Button>
                </div>
              </div>

              {sessions.filter((s) => s.status === SessionStatus.active)
                .length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-warm rounded-2xl p-5 mb-6 border-primary/20"
                >
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    <Hash className="inline h-3.5 w-3.5 mr-1" />
                    Sesi Aktif — PIN untuk Dibagikan
                  </p>
                  {sessions
                    .filter((s) => s.status === SessionStatus.active)
                    .map((s) => (
                      <div key={s.id.toString()} className="mb-2 last:mb-0">
                        <p className="text-sm font-semibold text-foreground mb-1.5">
                          {s.title}
                        </p>
                        <PinBadge pin={s.pin} />
                      </div>
                    ))}
                </motion.div>
              )}

              {loadingSessions ? (
                <div
                  className="flex justify-center py-12"
                  data-ocid="admin.loading_state"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : sessions.length === 0 ? (
                <div
                  className="text-center py-16 card-warm rounded-2xl"
                  data-ocid="admin.empty_state"
                >
                  <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground font-medium">
                    Belum ada sesi
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Klik &ldquo;Buat Sesi&rdquo; untuk memulai
                  </p>
                </div>
              ) : (
                <div className="space-y-4" data-ocid="admin.list">
                  {sessions.map((session, i) => (
                    <SessionCard
                      key={session.id.toString()}
                      session={session}
                      index={i}
                      onViewAttendees={setSelectedSession}
                    />
                  ))}
                </div>
              )}

              {/* Manage Admins section */}
              <div className="mt-8">
                <ManageAdminSection currentPrincipal={currentPrincipal} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CreateSessionDialog open={createOpen} onOpenChange={setCreateOpen} />
    </main>
  );
}
