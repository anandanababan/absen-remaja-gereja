import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChurchIcon, ShieldCheck, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import AdminPage from "./pages/AdminPage";
import CheckInPage from "./pages/CheckInPage";

const queryClient = new QueryClient();

type Page = "checkin" | "admin";

function Nav({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <ChurchIcon className="h-4 w-4 text-primary" />
          </div>
          <span className="font-display font-bold text-foreground text-lg leading-none">
            Remaja
            <span className="text-primary">Church</span>
          </span>
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
          <button
            type="button"
            onClick={() => setPage("checkin")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              page === "checkin"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-ocid="nav.tab"
          >
            <Users className="h-3.5 w-3.5" />
            Absen
          </button>
          <button
            type="button"
            onClick={() => setPage("admin")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              page === "admin"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-ocid="nav.tab"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin
          </button>
        </div>
      </nav>
    </header>
  );
}

function AppContent() {
  const [page, setPage] = useState<Page>("checkin");

  return (
    <div className="min-h-screen">
      <Nav page={page} setPage={setPage} />
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {page === "checkin" ? <CheckInPage /> : <AdminPage />}
        </motion.div>
      </AnimatePresence>

      <footer className="border-t border-border py-6 mt-8">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
