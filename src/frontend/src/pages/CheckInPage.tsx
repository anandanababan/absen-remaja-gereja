import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, ChurchIcon, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useSubmitAttendance } from "../hooks/useQueries";

export default function CheckInPage() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [successName, setSuccessName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const submitAttendance = useSubmitAttendance();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    if (!name.trim() || pin.length !== 6) return;

    try {
      await submitAttendance.mutateAsync({ name: name.trim(), pin });
      setSuccessName(name.trim());
      setName("");
      setPin("");
    } catch (err: any) {
      const msg = err?.message || "";
      if (
        msg.includes("invalid") ||
        msg.includes("Invalid") ||
        msg.includes("PIN")
      ) {
        setErrorMsg("PIN tidak valid. Mohon periksa kembali PIN sesi.");
      } else if (msg.includes("closed") || msg.includes("Closed")) {
        setErrorMsg("Sesi ini sudah ditutup. Hubungi admin.");
      } else if (msg.includes("already") || msg.includes("Already")) {
        setErrorMsg("Kamu sudah absen di sesi ini.");
      } else {
        setErrorMsg("Gagal melakukan absen. Coba lagi.");
      }
    }
  }

  function handleReset() {
    setSuccessName("");
    setErrorMsg("");
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {successName ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="card-warm rounded-2xl p-8 text-center"
              data-ocid="checkin.success_state"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.1,
                  type: "spring",
                  stiffness: 200,
                  damping: 12,
                }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
              >
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </motion.div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Absen Berhasil! 🎉
              </h2>
              <p className="text-muted-foreground mb-2">Selamat datang,</p>
              <p className="font-display text-3xl font-bold text-primary mb-6">
                {successName}
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Kehadiran kamu sudah tercatat. Tuhan memberkati!
              </p>
              <Button
                onClick={handleReset}
                className="btn-primary-warm text-primary-foreground w-full rounded-xl py-6 text-base font-semibold"
                data-ocid="checkin.primary_button"
              >
                Absen Lagi
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <ChurchIcon className="h-8 w-8 text-primary" />
                </div>
                <h1 className="font-display text-3xl font-bold text-foreground">
                  Absen Hadir
                </h1>
                <p className="text-muted-foreground mt-2">
                  Masukkan nama dan PIN sesi dari admin
                </p>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="card-warm rounded-2xl p-6 space-y-5"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-semibold text-foreground"
                  >
                    Nama Lengkap
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Masukkan nama kamu..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl py-6 text-base border-border focus:ring-primary"
                    required
                    data-ocid="checkin.input"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="pin"
                    className="text-sm font-semibold text-foreground"
                  >
                    PIN Sesi
                  </Label>
                  <Input
                    id="pin"
                    type="text"
                    inputMode="numeric"
                    placeholder="6 digit PIN"
                    value={pin}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setPin(v);
                    }}
                    className="rounded-xl py-6 text-base text-center font-mono tracking-[0.3em] border-border focus:ring-primary"
                    maxLength={6}
                    required
                    data-ocid="checkin.search_input"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {pin.length}/6 digit
                  </p>
                </div>

                <AnimatePresence>
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
                      data-ocid="checkin.error_state"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {errorMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  disabled={
                    submitAttendance.isPending ||
                    !name.trim() ||
                    pin.length !== 6
                  }
                  className="btn-primary-warm text-primary-foreground w-full rounded-xl py-6 text-base font-semibold"
                  data-ocid="checkin.submit_button"
                >
                  {submitAttendance.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Absen Sekarang ✓"
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground mt-4">
                Minta PIN sesi kepada pemimpin atau admin
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
