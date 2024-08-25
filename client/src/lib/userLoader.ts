import { redirect } from "react-router-dom";
import { api } from "../store/services/user";
import store from "../store/store";
import logger from "./logger";

export const userLoader = async () => {
  const getUser = store.dispatch(api.endpoints.getUser.initiate());
  const user = await getUser.unwrap().catch((error) => {
    logger.error(error);
    // return redirect("/login");
    return null;
  });

  return user;
};
