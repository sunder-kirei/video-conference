import { configureStore } from "@reduxjs/toolkit";
import { api as authApi } from "./services/auth";
import mediaReducer from "./services/media";
import userReducer, { api as userApi } from "./services/user";

const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    user: userReducer,
    media: mediaReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: ["media"],
        ignoredActionPaths: ["payload", "meta"],
      },
    })
      .concat(authApi.middleware)
      .concat(userApi.middleware),
  devTools: true,
});

export default store;
