import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

type Props = {
  className?: string;
  images: string[];
  data: {
    title: string;
    subtitle: string;
  }[];
};

const variants = {
  entry: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  inFrame: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
};

const pillVariants = {
  pill: {
    width: "4rem",
    backgroundColor: "rgba(0,0,0,1)",
  },
  circle: {
    aspectRatio: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
};

function Carousel({ className, images, data }: Props) {
  const [[selectedIdx, direction], setSelectedIdx] = useState([0, 0]);

  const changeIdx = (newIdx: number) => {
    const direction = newIdx > selectedIdx ? 1 : -1;
    if (newIdx < 0) newIdx = images.length - 1;

    newIdx %= images.length;
    setSelectedIdx([newIdx, direction]);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedIdx(([idx]) => [(idx + 1) % images.length, 1]);
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [selectedIdx]);

  return (
    <div
      className={twMerge(
        "flex flex-col items-center w-full aspect-square overflow-hidden gap-y-4",
        className
      )}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={selectedIdx}
          style={{
            backgroundImage: `url(${images[selectedIdx]})`,
          }}
          variants={variants}
          initial="entry"
          animate="inFrame"
          exit="exit"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = Math.abs(offset.x) * velocity.x;
            if (swipe < -10000) {
              changeIdx(selectedIdx + 1);
            } else if (swipe > 10000) {
              changeIdx(selectedIdx - 1);
            }
          }}
          transition={{
            bounceDamping: 100,
            ease: "easeInOut",
            duration: 0.25,
          }}
          custom={direction}
          className="h-full p-8 aspect-square bg-no-repeat bg-contain  bg-origin-content"
        />
      </AnimatePresence>

      <motion.div
        key={selectedIdx}
        variants={variants}
        initial="entry"
        animate="inFrame"
        transition={{
          bounceDamping: 100,
          ease: "easeInOut",
          duration: 0.75,
        }}
        custom={direction}
        className="flex flex-col items-center gap-y-2"
      >
        <h2 className="text-3xl">{data[selectedIdx].title}</h2>
        <h3 className="text-base">{data[selectedIdx].subtitle}</h3>
      </motion.div>

      <motion.div
        layout
        className="position w-fit bg-white rounded-full flex justify-center gap-x-4 flex-row h-4 py-1 px-3"
      >
        {images.map((_, idx) => {
          return (
            <motion.div
              key={idx}
              variants={pillVariants}
              initial="circle"
              animate={selectedIdx === idx ? "pill" : "circle"}
              className="h-full rounded-full"
              onClick={() => changeIdx(idx)}
            />
          );
        })}
      </motion.div>
    </div>
  );
}

export default Carousel;
