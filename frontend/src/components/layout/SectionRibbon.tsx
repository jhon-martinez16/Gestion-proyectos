import { motion } from "framer-motion";

interface Props {
  title: string;
  subtitle?: string;
}

export default function SectionRibbon({ title, subtitle }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-10 rounded-2xl p-6 bg-gradient-to-r from-[#0B355A] to-[#0F4C81] shadow-xl border border-white/10"
    >
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {subtitle && (
        <p className="text-sm text-[#9FB3C8] mt-2">{subtitle}</p>
      )}
    </motion.div>
  );
}