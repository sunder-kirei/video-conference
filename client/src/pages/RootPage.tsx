import { AnimatePresence } from "framer-motion";
import { Outlet, redirect, useLoaderData, useNavigate } from "react-router-dom";
import Nav from "../components/ui/Nav";
import store from "../store/store";
import { api } from "../store/services/user";
import logger from "../lib/logger";

export default function Root() {
  return (
    <AnimatePresence mode="wait">
      <Nav key="nav" />
      <Outlet key="outlet" />
    </AnimatePresence>
  );
}
