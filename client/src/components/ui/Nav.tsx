import React from "react";
import LoadingIcon from "../Loading/LoadingIcon";
import { useAppSelector } from "../../hooks/redux";
import { selectUser } from "../../store/services/user";
import logger from "../../lib/logger";
import UserBadge from "./UserBadge";
import { useNavigate } from "react-router-dom";

type Props = {};

function Nav({}: Props) {
  const user = useAppSelector(selectUser);
  const navigate = useNavigate();

  return (
    <nav className="h-20 p-4 w-full border-b">
      <ul className="flex h-full justify-between">
        <li
          className="flex h-full gap-x-4 items-center w-fit font-heading text-4xl cursor-pointer"
          onClick={() => {
            navigate("/");
          }}
        >
          <LoadingIcon noanimation className="h-full aspect-square p-2" />
          Video Conference
        </li>
        {user ? (
          <UserBadge
            user={
              user && {
                username: user.username,
                profilePicture: user.profilePicture,
              }
            }
          />
        ) : (
          <li />
        )}
      </ul>
    </nav>
  );
}

export default Nav;
