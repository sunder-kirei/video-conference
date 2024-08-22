import { createBrowserRouter } from "react-router-dom";
import ErrorPage from "./routes/ErrorPage";
import LoadingPage from "./routes/LoadingPage";
import RootPage from "./routes/RootPage";
import LoginPage from "./routes/LoginPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/loading",
    element: <LoadingPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
]);

export default router;
