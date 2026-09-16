import { motion } from "framer-motion";
import { Bot, Coins, Cog, Zap } from "lucide-react";

export function ProfitRobot() {
  return (
    <div
      className="relative h-24 overflow-hidden rounded-lg border border-success/20 bg-background/70"
      aria-label="Profit generator working"
    >
      <div className="absolute inset-x-3 bottom-3 h-px bg-success/25" />
      <motion.div
        className="absolute bottom-3 left-4"
        animate={{ y: [0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
      >
        <div className="relative flex h-14 w-14 items-center justify-center rounded-md border border-success/30 bg-card shadow-sm">
          <Bot className="h-8 w-8 text-success" />
          <motion.span
            className="absolute right-2 top-4 h-1.5 w-1.5 rounded-full bg-success"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          />
        </div>
        <motion.div
          className="absolute -right-8 top-5 h-1.5 w-9 origin-left rounded-full bg-success/50"
          animate={{ rotate: [-18, 18, -18] }}
          transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
        />
      </motion.div>

      <motion.div
        className="absolute right-6 top-3 text-primary"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2.8, ease: "linear" }}
      >
        <Cog className="h-8 w-8" />
      </motion.div>
      <motion.div
        className="absolute right-16 top-5 text-accent"
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
      >
        <Cog className="h-5 w-5" />
      </motion.div>

      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute bottom-4 left-28 text-warning"
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{ x: [0, 70], y: [0, -26, 0], opacity: [0, 1, 1, 0] }}
          transition={{ repeat: Infinity, duration: 2.1, delay: i * 0.7, ease: "easeInOut" }}
        >
          <Coins className="h-4 w-4" />
        </motion.div>
      ))}

      <div className="absolute bottom-2 right-3 flex items-center gap-1 text-[9px] font-bold uppercase text-success">
        <motion.span
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <Zap className="h-3 w-3" />
        </motion.span>
        Generating profit
      </div>
    </div>
  );
}
