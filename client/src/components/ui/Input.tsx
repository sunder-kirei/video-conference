/* eslint-disable react/prop-types */
import { AnimatePresence, motion } from "framer-motion";
import { useController, UseControllerProps } from "react-hook-form";
import { twMerge } from "tailwind-merge";

interface InputProps {
  props: React.InputHTMLAttributes<HTMLInputElement>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldProps: UseControllerProps<any>;
}

function Input({ props, fieldProps }: InputProps) {
  const { field, fieldState } = useController(fieldProps);

  return (
    <motion.div layout className={twMerge("max-w-96 w-full", props.className)}>
      <input
        {...props}
        {...field}
        className="p-4 rounded z-10 w-full border outline-blue-600"
      />
      <AnimatePresence mode="wait">
        {fieldState.error && (
          <motion.p
            key={props.name}
            layout
            initial={{
              y: -20,
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              x: -20,
              opacity: 0,
            }}
            className="px-4 text-red-500 italic -z-10"
          >
            {fieldState.error.message}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Input;
