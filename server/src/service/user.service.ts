import { FilterQuery } from "mongoose";
import UserModel, { UserDocument, UserInput } from "../model/user.model";

async function createUser(userInput: UserInput) {
  try {
    const foundUser = await findUser({ email: userInput.email });
    if (foundUser) return null;
    const user = await UserModel.create(userInput);
    return user;
  } catch (err) {
    throw err;
  }
}

function findUser(query: FilterQuery<UserDocument>) {
  return UserModel.findOne(query);
}

export default { createUser, findUser };
