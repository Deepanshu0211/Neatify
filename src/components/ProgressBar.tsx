import { motion } from "framer-motion";

interface Props {
  value: number;
}

export default function ProgressBar({ value }: Props) {
  return (
    <div className="w-full bg-gray-800 rounded-full h-5 overflow-hidden shadow-lg">
      <motion.div
        className="bg-zinc-500 h-full"
        initial={{ width: "0%" }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}
