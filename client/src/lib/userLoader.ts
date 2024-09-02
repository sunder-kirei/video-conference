import { api } from "../store/services/user";
import store from "../store/store";

export const userLoader = async () => {
  const getUser = store.dispatch(api.endpoints.getUser.initiate());

  const user = await getUser.unwrap().catch((error) => {
    return null;
  });

  return user;
};
