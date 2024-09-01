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
import Page from "../components/ui/Page";

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

function AuthPage({}: Props) {
  const [searchParams, setUserParams] = useSearchParams();

  const onSubmit = async () => {
    const url =
      process.env.REACT_APP_BACKEND +
      "/api/auth/google?callback=" +
      window.location.origin +
      searchParams.get("callback");

    window.location.href = url;
  };

  return (
    <Page className="grid grid-cols-2 items-center gap-x-4 overflow-y-hidden">
      <Carousel className="mx-auto p-12" images={images} data={data} />
      <main className="flex flex-col h-full justify-center items-center">
        <AnimatePresence mode="wait">
          {searchParams.get("new") ? (
            <CreateAccountForm
              key={"create-account"}
              callback={searchParams.get("callback")}
            />
          ) : (
            <LoginUserForm
              key={"login-account"}
              callback={searchParams.get("callback")}
            />
          )}
        </AnimatePresence>
        <GoogleAuthButton className="bg-green-400 mt-4" onClick={onSubmit} />
      </main>
    </Page>
  );
}

export default AuthPage;
