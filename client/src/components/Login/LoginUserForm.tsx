import { zodResolver } from "@hookform/resolvers/zod";
import { HTMLMotionProps, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import logger from "../../lib/logger";
import authSchema, { LoginUserSchema } from "../../schema/auth.schema";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { twMerge } from "tailwind-merge";
import {
  useCreateUserMutation,
  useLoginMutation,
} from "../../store/services/auth";
import toast from "react-hot-toast";

function LoginUserForm({
  callback,
  ...props
}: HTMLMotionProps<"form"> & { callback: string | null }) {
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

  const [login, { isLoading, isError }] = useLoginMutation();
  const navigate = useNavigate();

  const onSubmit = async ({ email, password }: LoginUserSchema) => {
    try {
      await toast.promise(login({ email, password }).unwrap(), {
        loading: "Authenticating",
        success: <b>Auth Successful👍</b>,
        error: <b>Something went wrong😥</b>,
      });
      navigate(callback ?? "/");
    } catch (err) {
      console.error(err);
    }
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
      {...props}
      className={twMerge(
        "flex flex-col items-center justify-center w-full gap-y-4 p-8",
        props.className
      )}
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
      <Button type="submit" className="mt-4">
        Login
      </Button>
      <Link
        to={"/auth?new=true"}
        className="underline text-blue-600 text-center"
      >
        Don't have an account?
      </Link>
    </motion.form>
  );
}

export default LoginUserForm;
