import { createBrowserRouter } from "react-router-dom";
import ErrorPage from "./pages/ErrorPage";
import LoadingPage from "./pages/LoadingPage";
import RootPage from "./pages/RootPage";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import { userLoader } from "./lib/userLoader";
import CallPage from "./pages/CallPage";
import { joinLoader } from "./lib/joinLoader";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootPage />,
    errorElement: <ErrorPage />,
    loader: userLoader,
    children: [
      {
        path: "/loading",
        element: <LoadingPage />,
      },
      {
        path: "/auth",
        element: <AuthPage />,
      },
      { path: "/join/:roomID?", element: <CallPage />, loader: joinLoader },
      {
        path: "",
        element: <HomePage />,
      },
    ],
  },
]);

export default router;
