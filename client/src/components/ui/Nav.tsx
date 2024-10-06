import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../hooks/redux";
import { selectUser } from "../../store/services/user";
import LoadingIcon from "../Loading/LoadingIcon";
import UserBadge from "./UserBadge";

function Nav() {
  const user = useAppSelector(selectUser);
  const navigate = useNavigate();

  return (
    <nav className="h-20 w-full border-b p-4">
      <ul className="flex h-full justify-between">
        <li
          className="flex h-full w-fit cursor-pointer items-center gap-x-4 font-heading text-4xl"
          onClick={() => {
            navigate("/");
          }}
        >
          <LoadingIcon noanimation className="aspect-square h-full p-2" />
          Video Conference
        </li>

        <UserBadge
          onClick={() => {
            navigate("/auth");
          }}
          user={
            user && {
              username: user.username,
              profilePicture: user.profilePicture,
            }
          }
        />
      </ul>
    </nav>
  );
}

export default Nav;
