import { HTMLMotionProps, motion } from "framer-motion";
import { twMerge } from "tailwind-merge";

function Button({ className, ...props }: HTMLMotionProps<"button">) {
  return (
    <motion.button
      {...props}
      className={twMerge(
        "w-full min-w-fit max-w-96 cursor-pointer bg-blue-600 p-4 text-xl font-bold text-white",
        className,
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
