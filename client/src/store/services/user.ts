import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query";
import { RootState, User, UserState } from "../../types";

export const api = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_BACKEND + "/api/user",
    credentials: "include",
  }),
  endpoints: ({ query, mutation }) => {
    return {
      getUser: query<User, void>({
        query: () => {
          return {
            url: "/",
            method: "GET",
          };
        },
      }),
    };
  },
});

const slice = createSlice({
  name: "user",
  initialState: { user: null } as UserState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addMatcher(
      api.endpoints.getUser.matchFulfilled,
      (state, { payload }) => {
        state.user = payload;
      }
    );
  },
});

export default slice.reducer;

export const selectUser = (state: RootState) => state.user.user;
