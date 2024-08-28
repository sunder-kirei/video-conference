import React from "react";
import { RTCUser, User } from "../../types";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";

function UserBadge({
  user,
  noanimation,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  user: RTCUser | undefined | null;
  noanimation?: boolean;
}) {
  const profilePicture = user?.profilePicture ?? "/assets/user.png";

  return (
    <div {...props} className={twMerge("relative", props.className)}>
      <motion.img
        whileHover={
          noanimation
            ? {}
            : {
                scale: 1.2,
              }
        }
        alt="profile picture"
        className="h-full aspect-square rounded-full border-2 border-blue-600 cursor-pointer"
        src={profilePicture}
      />
    </div>
  );
}

export default UserBadge;
