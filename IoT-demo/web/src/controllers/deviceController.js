import { createPool } from "mysql2/promise";

export const pool = createPool({
  host: "localhost",
  user: "root",
  password: "",
  port: 3306,
  database: "dbtest",
});

export const renderDevices = async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM devices");
  return rows;
//   res.render("devices", { devices: rows });
};

export const createDevices = async (req, res) => {
  const newCustomer = req.body;
  await pool.query("INSERT INTO devices set ?", [newCustomer]);
  res.redirect("/");
};

export const editDevice = async (req, res) => {
  const { id } = req.params;
  const [result] = await pool.query("SELECT * FROM devices WHERE id = ?", [id]);
  res.render("devices_edit", { customer: result[0] });
};

export const updateDevice = async (req, res) => {
  const { id } = req.params;
  const newCustomer = req.body;
  await pool.query("UPDATE devices set ? WHERE id = ?", [newCustomer, id]);
  res.redirect("/");
};

export const deleteDevice = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query("DELETE FROM devices WHERE id = ?", [id]);
  if (result.affectedRows === 1) {
    res.json({ message: "Device deleted" });
  }
  res.redirect("/");
};
