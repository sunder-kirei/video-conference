import mongoose from "mongoose";
import logger from "./logger";

async function connect() {
  const dbURL = process.env.DATABASE_URL;
  try {
    await mongoose.connect(dbURL!);
    logger.info("DB connected");
  } catch (error) {
    logger.error("Could not connect to db");
    process.exit(1);
  }
}

export default connect;
