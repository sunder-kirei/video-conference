import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import logger from "../../lib/logger";
import authSchema, { LoginUserSchema } from "../../schema/auth.schema";
import Button from "../ui/Button";
import Input from "../ui/Input";

function LoginUserForm() {
  const {
    control,
    handleSubmit,
    clearErrors,
    formState: { errors },
  } = useForm<LoginUserSchema>({
    mode: "onBlur",
    shouldFocusError: true,
    resolver: zodResolver(authSchema.loginUserSchema),
  });

  const onSubmit = (data: LoginUserSchema) => {
    if (errors) logger.info(data);
  };
  const onTouch = (name: any) => clearErrors(name);

  return (
    <motion.form
      initial={{
        x: -300,
        opacity: 0,
      }}
      animate={{
        x: 0,
        opacity: 1,
      }}
      exit={{
        x: 300,
        opacity: 0,
      }}
      transition={{
        bounce: 0,
      }}
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col items-center justify-center w-full gap-y-4 p-8"
    >
      <Input
        fieldProps={{ control: control, name: "email" }}
        props={{ placeholder: "Email", onClick: () => onTouch("email") }}
      />
      <Input
        fieldProps={{ control: control, name: "password" }}
        props={{
          placeholder: "Password",
          onClick: () => onTouch("password"),
          type: "password",
        }}
      />
      <Button type="submit" disabled={!errors.root?.message} className="mt-4">
        Create Account
      </Button>
      <Link
        to={"/login?new=true"}
        className="underline text-blue-600 text-center"
      >
        Don't have an account?
      </Link>
    </motion.form>
  );
}

export default LoginUserForm;
