import { configureStore } from "@reduxjs/toolkit";
import { api as authApi } from "./services/auth";
import userReducer, { api as userApi } from "./services/user";

const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(userApi.middleware),
});

export default store;
