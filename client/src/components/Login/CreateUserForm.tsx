import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import logger from "../../lib/logger";
import authSchema, { CreateUserSchema } from "../../schema/auth.schema";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useCreateUserMutation } from "../../store/services/auth";

function CreateAccountForm() {
  const {
    handleSubmit,
    clearErrors,
    formState: { errors },
    control,
  } = useForm<CreateUserSchema>({
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
    logger.info("Submit called");
    await createUser({ passwordConfirmation, email, password, username })
      .unwrap()
      .then((data) => {
        navigate("/");
      })
      .catch((err) => {
        logger.error(err);
        alert(err);
      });
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
      className="flex flex-col items-center justify-center w-full gap-y-4 p-8"
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
      <Button
        type="submit"
        // disabled={!errors.root?.message}
        className="mt-4"
        onClick={handleSubmit(onSubmit)}
      >
        Create Account
      </Button>
      <Link to={"/login"} className="underline text-blue-600 text-center">
        Already have an account?
      </Link>
    </motion.form>
  );
}

export default CreateAccountForm;
