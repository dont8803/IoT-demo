import express from "express";
import homePageController from "../controllers/homePageController";
import registerController from "../controllers/registerController";
import loginController from "../controllers/loginController";
import auth from "../validation/authValidation";
import passport from "passport";
import initPassportLocal from "../controllers/passportLocalController";

import {
  createDevices,
  deleteDevice,
  editDevice,
  renderDevices,
  updateDevice,
} from "../controllers/deviceController.js";
// Init all passport
initPassportLocal();

let router = express.Router();

let initWebRoutes = (app) => {
  router.get(
    "/",
    loginController.checkLoggedIn,
    homePageController.handleHelloWorld
  );
  router.get(
    "/login",
    loginController.checkLoggedOut,
    loginController.getPageLogin
  );
  router.post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/login",
      successFlash: true,
      failureFlash: true,
    })
  );

  router.get("/list", renderDevices);
  router.post("/add", createDevices);
  router.get("/update/:id", editDevice);
  router.post("/update/:id", updateDevice);
  router.get("/delete/:id", deleteDevice);

  router.get("/register", registerController.getPageRegister);
  router.post(
    "/register",
    auth.validateRegister,
    registerController.createNewUser
  );
  router.post("/logout", loginController.postLogOut);
  return app.use("/", router);
};
module.exports = initWebRoutes;
