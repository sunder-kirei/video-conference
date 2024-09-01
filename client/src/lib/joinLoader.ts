import { LoaderFunction, redirect } from "react-router-dom";
import store from "../store/store";
import { userLoader } from "./userLoader";

export const joinLoader: LoaderFunction<any> = async ({ params }) => {
  await userLoader();

  const roomID = params.roomID;
  const user = store.getState().user.user;

  if (user) return user;

  return redirect("/auth?callback=/join/" + (roomID ?? ""));
};
