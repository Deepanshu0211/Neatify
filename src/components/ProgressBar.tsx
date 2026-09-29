import { motion } from "framer-motion";

interface Props {
  value: number;
}

export default function ProgressBar({ value }: Props) {
  return (
    <div className="progress-track">
      <motion.div
        className="progress-fill"
        initial={{ width: "0%" }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}
