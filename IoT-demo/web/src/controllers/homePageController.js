import { renderDevices } from "./deviceController.js";

let handleHelloWorld = async (req, res) => {
  //   console.log(await renderDevices());
  console.log(req.user);

  return res.render("index.ejs", {
    user: req.user,
    devices: await renderDevices(),
  });
};

module.exports = {
  handleHelloWorld: handleHelloWorld,
};
