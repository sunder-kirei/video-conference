import React from "react";
import LoadingIcon from "../Loading/LoadingIcon";
import { useAppSelector } from "../../hooks/redux";
import { selectUser } from "../../store/services/user";
import logger from "../../lib/logger";
import UserBadge from "./UserBadge";

type Props = {};

function Nav({}: Props) {
  const user = useAppSelector(selectUser);

  return (
    <nav className="h-20 p-4 w-full border-b">
      <ul className="flex h-full justify-between">
        <li className="flex h-full gap-x-4 items-center w-fit font-heading text-4xl">
          <LoadingIcon
            noanimation
            className="h-full aspect-square p-2 cursor-pointer"
          />
          Video Conference
        </li>
        {user ? <UserBadge user={user} /> : <li />}
      </ul>
    </nav>
  );
}

export default Nav;
