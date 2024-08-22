import React, { useEffect } from "react";
import Carousel from "../components/ui/Carousel";
import {
  FieldValue,
  FieldValues,
  useController,
  UseControllerProps,
  useForm,
  UseFormRegisterReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import authSchema, {
  CreateUserSchema,
  LoginUserSchema,
} from "../schema/auth.schema";
import logger from "../lib/logger";
import { twMerge } from "tailwind-merge";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../components/ui/Button";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import CreateAccountForm from "../components/Login/CreateUserForm";
import LoginUserForm from "../components/Login/LoginUserForm";
import GoogleAuthButton from "../components/GoogleAuthButton/GoogleAuthButton";

type Props = {};

const images = [
  "/assets/messenger.png",
  "/assets/login-connect.svg",
  "/assets/webrtc.png",
];

const data = [
  {
    title: "connect",
    subtitle: "subtitle",
  },
  {
    title: "sidasd",
    subtitle: "subtitle",
  },
  {
    title: "fsd",
    subtitle: "subtitle",
  },
];

function LoginPage({}: Props) {
  const [searchParams, setUserParams] = useSearchParams();

  const onSubmit = async () => {
    window.location.href =
      "http://localhost:3000/api/auth/google?callback=http://localhost:3001";
  };

  return (
    <div className="h-full w-full grid grid-cols-2 items-center gap-x-4">
      <Carousel className="mx-auto p-12" images={images} data={data} />
      <main className="flex flex-col h-full justify-center items-center">
        <AnimatePresence mode="wait">
          {searchParams.get("new") ? (
            <CreateAccountForm key={"create-account"} />
          ) : (
            <LoginUserForm key={"login-account"} />
          )}
        </AnimatePresence>
        <GoogleAuthButton className="bg-green-400 mt-4" onClick={onSubmit} />
      </main>
    </div>
  );
}

export default LoginPage;
