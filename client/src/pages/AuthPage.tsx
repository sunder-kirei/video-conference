import { AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import GoogleAuthButton from "../components/GoogleAuthButton/GoogleAuthButton";
import CreateAccountForm from "../components/Login/CreateUserForm";
import LoginUserForm from "../components/Login/LoginUserForm";
import Carousel from "../components/ui/Carousel";
import Page from "../components/ui/Page";

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

function AuthPage() {
  const [searchParams] = useSearchParams();

  const onSubmit = async () => {
    const url =
      "/api/auth/google?callback=" +
      window.location.origin +
      (searchParams.get("callback") ?? "");

    window.location.href = url;
  };

  return (
    <Page className="grid grid-cols-2 items-center gap-x-4 overflow-y-hidden">
      <Carousel className="mx-auto p-12" images={images} data={data} />
      <main className="flex h-full flex-col items-center justify-center">
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
        <GoogleAuthButton className="mt-4 bg-green-400" onClick={onSubmit} />
      </main>
    </Page>
  );
}

export default AuthPage;
