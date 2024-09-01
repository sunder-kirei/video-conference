import React from "react";
import { HTMLMotionProps, motion } from "framer-motion";
import { twMerge } from "tailwind-merge";

type Props = {};

function Button({ className, ...props }: HTMLMotionProps<"button">) {
  return (
    <motion.button
      {...props}
      className={twMerge(
        "max-w-96 w-full min-w-fit p-4 bg-blue-600 text-white text-xl font-bold cursor-pointer",
        className
      )}
      whileHover={{
        scale: 1.2,
      }}
      whileTap={{
        scale: 1,
      }}
    >
      {props.children}
    </motion.button>
  );
}

export default Button;
