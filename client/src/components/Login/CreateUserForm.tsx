/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from "@hookform/resolvers/zod";
import { HTMLMotionProps, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import authSchema, { CreateUserSchema } from "../../schema/auth.schema";
import { useCreateUserMutation } from "../../store/services/auth";
import Button from "../ui/Button";
import Input from "../ui/Input";

function CreateAccountForm({
  callback,
  ...props
}: HTMLMotionProps<"form"> & { callback: string | null }) {
  const { handleSubmit, clearErrors, control } = useForm<CreateUserSchema>({
    mode: "onBlur",
    shouldFocusError: true,
    reValidateMode: "onBlur",
    resolver: zodResolver(authSchema.createUserSchema),
  });

  const [createUser] = useCreateUserMutation();
  const navigate = useNavigate();

  const onSubmit = async ({
    email,
    password,
    passwordConfirmation,
    username,
  }: CreateUserSchema) => {
    await toast.promise(
      createUser({ email, password, passwordConfirmation, username }).unwrap(),
      {
        loading: "Creating User...",
        success: <b>Auth Successful👍</b>,
        error: <b>Something went wrong😥</b>,
      },
    );
    navigate(callback ?? "/");
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
      id="create-user"
      onSubmit={handleSubmit(onSubmit)}
      {...props}
      className={twMerge(
        "flex w-full flex-col items-center justify-center gap-y-4 p-8",
        props.className,
      )}
    >
      <Input
        fieldProps={{ control: control, name: "email" }}
        props={{ placeholder: "Email", onClick: () => onTouch("email") }}
      />
      <Input
        fieldProps={{ control: control, name: "username" }}
        props={{ placeholder: "Username", onClick: () => onTouch("username") }}
      />
      <Input
        fieldProps={{ control: control, name: "password" }}
        props={{
          placeholder: "Password",
          onClick: () => onTouch("password"),
          type: "password",
        }}
      />
      <Input
        fieldProps={{ control: control, name: "passwordConfirmation" }}
        props={{
          placeholder: "Confirm Password",
          onClick: () => onTouch("passwordConfirmation"),
          type: "password",
        }}
      />
      <Button type="submit" className="mt-4">
        Create Account
      </Button>
      <Link to={"/auth"} className="text-center text-blue-600 underline">
        Already have an account?
      </Link>
    </motion.form>
  );
}

export default CreateAccountForm;
