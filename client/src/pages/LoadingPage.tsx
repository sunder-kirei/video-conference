import React from "react";
import LoadingIcon from "../components/Loading/LoadingIcon";
import { AnimatePresence, motion } from "framer-motion";
import Page from "../components/ui/Page";

type Props = {};

export default function LoadingPage({}: Props) {
  return (
    <Page id="loading-page" className="grid place-items-center" noAnimation>
      <LoadingIcon className="w-64 aspect-square" />
    </Page>
  );
}
