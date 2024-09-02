import { motion } from "framer-motion";
import React from "react";
import { twMerge } from "tailwind-merge";
import { RTCUser } from "../../types";

function UserBadge({
  user,
  noanimation,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  user: RTCUser | undefined | null;
  noanimation?: boolean;
}) {
  const profilePicture = user?.profilePicture ?? "/assets/user.png";

  return (
    <div {...props} className={twMerge("relative", className)}>
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
