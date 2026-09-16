import { useEffect, useRef, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, X } from "lucide-react";
import { formatXAF } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

// More than 500 distinct Cameroonian name combinations. Names can repeat naturally.
const FIRSTS = [
  "Achille",
  "Marie-Claire",
  "Jean-Paul",
  "Estelle",
  "Boris",
  "Chantal",
  "Serge",
  "Nadine",
  "Patrick",
  "Sylvie",
  "Emmanuel",
  "Grace",
  "Yannick",
  "Aline",
  "Guy",
  "Rachelle",
  "Christian",
  "Larissa",
  "Franck",
  "Aïcha",
  "Bertrand",
  "Solange",
  "Cédric",
  "Mireille",
  "Léon",
  "Josiane",
  "Armand",
  "Brigitte",
  "Dieudonné",
  "Carine",
  "Éric",
  "Florence",
  "Gaston",
  "Hortense",
  "Ismaël",
  "Judith",
  "Kévin",
  "Liliane",
  "Maxime",
  "Noëlle",
  "Olivier",
  "Pauline",
  "Quentin",
  "Rebecca",
  "Stéphane",
  "Thérèse",
  "Ulric",
  "Valérie",
  "William",
  "Xavier",
  "Yolande",
  "Zacharie",
  "Abdou",
  "Blaise",
  "Clarisse",
  "Damien",
  "Edwige",
  "Fabrice",
  "Georgette",
  "Hervé",
  "Irène",
  "Jules",
  "Ketsia",
  "Landry",
  "Manuela",
  "Nestor",
  "Odette",
  "Paul",
  "Rita",
  "Samuel",
  "Tatiana",
  "Ursule",
  "Vincent",
  "Wilfrid",
  "Yves",
  "Zita",
  "Alain",
  "Beatrice",
  "Charline",
  "Doris",
  "Elvis",
  "Fanny",
  "Gilbert",
  "Henriette",
  "Ivan",
  "Joëlle",
  "Konrad",
  "Léa",
  "Mathieu",
];
const LASTS = [
  "Abanda",
  "Abega",
  "Abessolo",
  "Aboubakar",
  "Achu",
  "Akoa",
  "Amougou",
  "Atangana",
  "Ayissi",
  "Babangida",
  "Balla",
  "Banda",
  "Belinga",
  "Biya",
  "Bongben",
  "Bouba",
  "Che",
  "Dikoumé",
  "Djoumessi",
  "Ekambi",
  "Ekotto",
  "Elanga",
  "Essomba",
  "Eto'o",
  "Fai",
  "Fokou",
  "Kameni",
  "Kamga",
  "Kana",
  "Kengne",
  "Kome",
  "Kouam",
  "Mabouka",
  "Manga",
  "Mbarga",
  "Mbida",
  "Milla",
  "Moukandjo",
  "Ndam",
  "Ndip",
  "Ndom",
  "Ngadeu",
  "Ngannou",
  "Ngo'o",
  "Ngono",
  "Njie",
  "Njoya",
  "Nkoulou",
  "Nsame",
  "Ntcham",
  "Ntep",
  "Nyom",
  "Ondoa",
  "Onana",
  "Oyongo",
  "Salli",
  "Song",
  "Tchami",
  "Tchatchoua",
  "Toko",
];

const CITIES = [
  "Douala",
  "Yaoundé",
  "Bafoussam",
  "Kribi",
  "Garoua",
  "Bamenda",
  "Limbe",
  "Buea",
  "Ngaoundéré",
  "Bertoua",
  "Ebolowa",
  "Maroua",
  "Dschang",
  "Edéa",
  "Nkongsamba",
  "Kumba",
];

type Notice = {
  id: number;
  kind: "deposit" | "withdraw";
  name: string;
  city: string;
  amount: number;
  minsAgo: number;
};

const AMOUNT_BUCKETS = [
  5000, 10000, 15000, 20000, 25000, 35000, 50000, 75000, 100000, 150000, 200000, 275000, 350000,
  500000, 750000,
];

function makeFakeNotice(id: number): Notice {
  const kind: "deposit" | "withdraw" = Math.random() < 0.58 ? "deposit" : "withdraw";
  const first = FIRSTS[Math.floor(Math.random() * FIRSTS.length)];
  const last = LASTS[Math.floor(Math.random() * LASTS.length)];
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const amount = AMOUNT_BUCKETS[Math.floor(Math.random() * AMOUNT_BUCKETS.length)];
  const minsAgo = 1 + Math.floor(Math.random() * 29);
  return { id, kind, name: `${first} ${last}`, city, amount, minsAgo };
}

function minutesAgo(ts: string): number {
  const diff = Date.now() - new Date(ts).getTime();
  return Math.max(1, Math.round(diff / 60000));
}

function playChime() {
  try {
    const AudioCtx =
      (
        window as unknown as {
          AudioContext?: typeof AudioContext;
          webkitAudioContext?: typeof AudioContext;
        }
      ).AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [880, 1320];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.14;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.34);
    });
    setTimeout(() => ctx.close().catch(() => {}), 900);
  } catch {
    /* audio not available */
  }
}

type Row = { kind: string; first_name: string; amount: number; created_at: string };

export function SocialProof() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const realQueue = useRef<Notice[]>([]);
  const seen = useRef<Set<string>>(new Set());
  const counter = useRef(0);

  // Fetch real activity frequently; both server and client enforce the 30-minute window.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase.rpc("recent_activity", { _limit: 15 });
      if (cancelled || !data) return;
      const cutoff = Date.now() - 30 * 60 * 1000;
      const rows = (data as Row[]).filter((row) => new Date(row.created_at).getTime() >= cutoff);
      for (const r of rows) {
        const key = `${r.kind}|${r.created_at}|${r.amount}`;
        if (seen.current.has(key)) continue;
        seen.current.add(key);
        counter.current += 1;
        realQueue.current.push({
          id: counter.current,
          kind: r.kind === "withdraw" ? "withdraw" : "deposit",
          name: r.first_name || "Investor",
          city: CITIES[Math.floor(Math.random() * CITIES.length)],
          amount: Number(r.amount),
          minsAgo: minutesAgo(r.created_at),
        });
      }
    };
    load();
    const iv = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, []);

  // Notification cycle
  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;
    let nextTimer: ReturnType<typeof setTimeout>;

    const cycle = () => {
      // Prefer a real event; fall back to fabricated
      const next = realQueue.current.shift();
      if (next) {
        setNotice(next);
      } else {
        counter.current += 1;
        setNotice(makeFakeNotice(counter.current));
      }
      playChime();
      hideTimer = setTimeout(() => setNotice(null), 5000);
      nextTimer = setTimeout(cycle, 11000);
    };

    const initial = setTimeout(cycle, 3500);
    return () => {
      clearTimeout(initial);
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
    };
  }, []);

  if (!notice) return null;

  const isDeposit = notice.kind === "deposit";
  const Icon = isDeposit ? ArrowDownCircle : ArrowUpCircle;

  return (
    <div
      key={notice.id}
      className="fixed bottom-4 left-3 right-3 z-50 animate-fade-in sm:left-4 sm:right-auto sm:max-w-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-elegant backdrop-blur">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
            isDeposit ? "bg-success/15 text-success" : "bg-accent/15 text-accent"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{notice.name}</span>
            <span className="hidden text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
              · {notice.city}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {isDeposit ? "just deposited" : "just withdrew"}{" "}
            <span className="font-bold uppercase tabular-nums text-foreground">
              {formatXAF(notice.amount)}
            </span>
          </div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            {notice.minsAgo} min ago
          </div>
        </div>
        <button
          onClick={() => setNotice(null)}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
