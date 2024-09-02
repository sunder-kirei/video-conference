import bcrypt from "bcrypt";
import config from "config";
import mongoose from "mongoose";

export interface UserInput {
  email: string;
  username: string;
  password?: string;
  profilePicture?: string;
}

export interface UserDocument extends UserInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<Boolean>;
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
  },
  {
    timestamps: true,
    methods: {
      async comparePassword(candidate: string): Promise<boolean> {
        return bcrypt
          .compare(candidate, this.password ?? "")
          .catch((reason) => false);
      },
    },
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(config.get<number>("bcrypt.saltFactor"));
  const hash = await bcrypt.hashSync(this.password ?? "", salt);
  this.password = hash;
  return next();
});

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
