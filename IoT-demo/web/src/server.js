require("dotenv").config();
import express from "express";
import configViewEngine from "./configs/viewEngine";
import initWebRoutes from "./routes/web";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectFlash from "connect-flash";
import passport from "passport";
const mysql2 = require("mysql2");
const mqtt = require("mqtt");
const WebSocket = require("ws");
const db = mysql2.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "dbtest",
  dateStrings: ["DATETIME"],
});

let app = express();

const mqttClient = mqtt.connect("mqtt://192.168.43.184:1883");
const wss = new WebSocket.Server({ port: 8081 });

//  web socket connection
wss.on("connection", (ws) => {
  console.log("Client Connected");
  ws.on("message", (message) => {
    const json = message.toString().split("|");
    db.query(
      `INSERT INTO action (device_id,status,time) VALUES('${json[0]}','${json[1]
      }','${timeNow()}')`,
      (err) => { }
    );
    mqttClient.publish("button", json[0] + "|" + json[1]);
  });
  ws.on("close", () => console.log("Client Disconnected"));
});

// receive data from mqtt broker
mqttClient.on('message', (topic, message) => {
  console.log(message.toString());
  // let message = "DHT11|35.0|60.0|1000";
  // let topic = "sensor";
  const json = message.toString().split("|");
  if (topic === "sensor") {
    let temp = json[1];
    if (temp >= 33.5) {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send("canh_bao");
          console.log("gui canh bao thanh cong");
        }
      });
    }
    db.query(
      `INSERT INTO sensor (device_id, temperature, humidity, light, time) VALUES ('${json[0]
      }', ${json[1]}, ${json[2]}, ${json[3]},'${timeNow()}')`,
      (err) => { }
    );
    console.log(json);
  }
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message.toString());
    }
  });
});
app.get("/sensor", (req, res) => {
    db.query("SELECT * FROM sensor LIMIT 100", (err, data) =>
      err ? console.error(err) : res.send(JSON.stringify(data))
    );
});
//app.get('/action', (req, res) => db.query("SELECT * FROM action LIMIT 20", (err, data) => (err) ? console.error(err) : res.send(JSON.stringify(data))));

app.get("/sensor/type=:type&input=:input", (req, res) =>
  db.query(
    `SELECT * FROM sensor where ${req.params.type} like '${req.params.input}'`,
    (err, data) => (err ? console.error(err) : res.send(JSON.stringify(data)))
  )
);

//app.get('/action1', (req, res) => db.query("SELECT count(*) FROM action where status like 'on'", (err, data) => (err) ? console.error(err) : res.send(JSON.stringify(data))));

app.get("/action1", (req, res) => {
  db.query(
    "SELECT count(*) as count FROM action where device_id='fan' and status like 'on'",
    (err, data) => {
      const count = data[0].count;
      res.send(count.toString());
    }
  );
});

app.get("/action2", (req, res) => {
  db.query(
    "SELECT count(*) as count FROM action where device_id='led' and status like 'on'",
    (err, data) => {
      const count = data[0].count;
      res.send(count.toString());
    }
  );
});

mqttClient.on("connect", () => {
  console.log("connected");
  mqttClient.subscribe("sensor");
  mqttClient.subscribe("action");
  mqttClient.publish("button", "test");
});

//use cookie parser
app.use(cookieParser("secret"));

//config session
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 86400000 1 day
    },
  })
);

// Enable body parser post data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Config view engine
configViewEngine(app);

//Enable flash message
app.use(connectFlash());

//Config passport middleware
app.use(passport.initialize());
app.use(passport.session());

// init all web routes
initWebRoutes(app);

let port = process.env.PORT || 8080;
app.listen(port, () =>
  console.log(`Building a login system with NodeJS is running on port ${port}!`)
);

function timeNow() {
  const dateTime = new Date();
  let time = dateTime.toTimeString().split(" ")[0];
  let [month, day, year] = dateTime.toLocaleDateString().split("/");
  return year + "-" + day + "-" + month + " " + time;
}
