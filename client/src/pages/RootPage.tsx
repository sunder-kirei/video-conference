import { AnimatePresence } from "framer-motion";
import { Outlet } from "react-router-dom";
import Nav from "../components/ui/Nav";

export default function Root() {
  return (
    <AnimatePresence mode="wait">
      <Nav key="nav" />
      <Outlet key="outlet" />
    </AnimatePresence>
  );
}
