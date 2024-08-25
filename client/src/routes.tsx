import { createBrowserRouter } from "react-router-dom";
import ErrorPage from "./pages/ErrorPage";
import LoadingPage from "./pages/LoadingPage";
import RootPage from "./pages/RootPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import { userLoader } from "./lib/userLoader";
import CallPage from "./pages/CallPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootPage />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/loading",
        element: <LoadingPage />,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
      { path: "/join/:roomID?", element: <CallPage /> },
      {
        path: "",
        loader: userLoader,
        element: <HomePage />,
      },
    ],
  },
]);

export default router;
