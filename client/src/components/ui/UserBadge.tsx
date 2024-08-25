import React from "react";
import { User } from "../../types";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";

function UserBadge({
  user,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { user: User | null }) {
  const profilePicture = user?.profilePicture ?? "/assets/user.png";

  return (
    <div {...props} className={twMerge("relative", props.className)}>
      <motion.img
        whileHover={{
          scale: 1.2,
        }}
        alt="profile picture"
        className="h-full aspect-square rounded-full border-2 border-blue-600 cursor-pointer"
        src={profilePicture}
      />
    </div>
  );
}

export default UserBadge;
