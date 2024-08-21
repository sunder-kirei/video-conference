import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createSlice } from "@reduxjs/toolkit";

import { CreateAccount, AuthResponse, LoginUser, RootState } from "../../types";
import logger from "../../lib/logger";

export const api = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_BACKEND + "/api/auth",
    credentials: "include",
  }),
  endpoints: ({ mutation }) => {
    return {
      createUser: mutation<string, CreateAccount>({
        query: (credentials) => {
          return {
            url: "/email/signup",
            method: "POST",
            body: credentials,
          };
        },
      }),
      login: mutation<string, LoginUser>({
        query: (credentials) => ({
          url: "/email/signin",
          method: "POST",
          body: credentials,
        }),
      }),
    };
  },
});

export const { useCreateUserMutation, useLoginMutation } = api;
