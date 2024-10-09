import { HTMLMotionProps, motion } from "framer-motion";
import { PropsWithChildren } from "react";
import { twMerge } from "tailwind-merge";

const variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

export default function Page({
  noAnimation,
  ...props
}: PropsWithChildren<HTMLMotionProps<"main">> & { noAnimation?: boolean }) {
  return (
    <motion.main
      {...props}
      variants={noAnimation ? {} : variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        bounce: 0,
        duration: 0.5,
        ease: "easeInOut",
      }}
      className={twMerge(
        "h-screen w-full overflow-x-hidden overflow-y-hidden pt-20",
        props.className,
      )}
    >
      {props.children}
    </motion.main>
  );
}
