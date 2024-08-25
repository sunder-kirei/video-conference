import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import router from "./routes";
import { Provider } from "react-redux";
import store from "./store/store";
import LoadingPage from "./pages/LoadingPage";
import { AnimatePresence } from "framer-motion";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Provider store={store}>
    <RouterProvider router={router} fallbackElement={<LoadingPage />} />
  </Provider>
);
