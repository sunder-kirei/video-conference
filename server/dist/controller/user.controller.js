"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getUserDetails(req, res, next) {
    const { id, username, email, profilePicture } = res.locals.user;
    res.send({ id, username, email, profilePicture });
}
exports.default = {
    getUserDetails,
};
