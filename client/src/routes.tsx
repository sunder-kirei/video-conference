import { createBrowserRouter } from "react-router-dom";
import { joinLoader } from "./lib/joinLoader";
import { userLoader } from "./lib/userLoader";
import AuthPage from "./pages/AuthPage";
import CallPage from "./pages/CallPage";
import ErrorPage from "./pages/ErrorPage";
import HomePage from "./pages/HomePage";
import LoadingPage from "./pages/LoadingPage";
import RootPage from "./pages/RootPage";

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
