import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";

import { createPortal } from "react-dom";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import LoadingPage from "./pages/LoadingPage";
import router from "./routes";
import store from "./store/store";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Provider store={store}>
    {createPortal(<Toaster position="bottom-right" />, document.body)}
    <RouterProvider router={router} fallbackElement={<LoadingPage />} />
  </Provider>
);
