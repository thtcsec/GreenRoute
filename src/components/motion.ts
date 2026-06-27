'use client';

export { motion, AnimatePresence } from 'framer-motion';

export const tabContentVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const tabContentTransition = { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] as const };
