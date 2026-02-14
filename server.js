require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Propiedad = require("./models/Propiedad");
const Contacto = require("./models/Contacto");

const app = express();

// =========================
// MIDDLEWARES
// =========================
app.use(
  cors({
    origin: "*", // 🔥 luego lo limitamos a tu Netlify
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// =========================
// CONEXIÓN MONGO
// =========================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => console.error("❌ Error MongoDB:", err.message));

// =========================
// RUTA PRINCIPAL (Render)
// =========================
app.get("/", (req, res) => {
  res.send("API Vendecasas funcionando ✅");
});

// =========================
// API PROPIEDADES
// =========================

// Obtener todas
app.get("/api/propiedades", async (req, res) => {
  try {
    const props = await Propiedad.find().sort({ id: 1 });
    res.json(props);
  } catch (e) {
    res.status(500).json({ error: "Error al obtener propiedades" });
  }
});

// Crear
app.post("/api/propiedades", async (req, res) => {
  try {
    const data = req.body;

    const last = await Propiedad.findOne().sort({ id: -1 });
    const nextId = last ? last.id + 1 : 1;

    const nueva = await Propiedad.create({
      ...data,
      id: nextId,
    });

    res.json(nueva);
  } catch (e) {
    res.status(500).json({ error: "Error al crear propiedad" });
  }
});

// Editar (acepta _id o id numérico)
app.put("/api/propiedades/:id", async (req, res) => {
  try {
    const param = req.params.id;

    // Si viene como número -> id incremental
    if (!isNaN(Number(param))) {
      const idNum = Number(param);

      const updated = await Propiedad.findOneAndUpdate({ id: idNum }, req.body, {
        new: true,
      });

      if (!updated) return res.status(404).json({ error: "No encontrada" });

      return res.json(updated);
    }

    // Si viene como string -> _id de Mongo
    const updated = await Propiedad.findByIdAndUpdate(param, req.body, {
      new: true,
    });

    if (!updated) return res.status(404).json({ error: "No encontrada" });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: "Error al actualizar propiedad" });
  }
});

// Eliminar (acepta _id o id numérico)
app.delete("/api/propiedades/:id", async (req, res) => {
  try {
    const param = req.params.id;

    if (!isNaN(Number(param))) {
      const idNum = Number(param);
      const deleted = await Propiedad.findOneAndDelete({ id: idNum });

      if (!deleted) return res.status(404).json({ error: "No encontrada" });

      return res.json({ ok: true });
    }

    const deleted = await Propiedad.findByIdAndDelete(param);

    if (!deleted) return res.status(404).json({ error: "No encontrada" });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Error al eliminar propiedad" });
  }
});

// Eliminar todo (reset)
app.delete("/api/propiedades", async (req, res) => {
  try {
    await Propiedad.deleteMany({});
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Error al vaciar propiedades" });
  }
});

// =========================
// API CONTACTO
// =========================
app.post("/api/contacto", async (req, res) => {
  try {
    const { nombre, telefono, mensaje } = req.body;

    if (!nombre || !telefono || !mensaje) {
      return res.status(400).json({ error: "Faltan campos" });
    }

    await Contacto.create({ nombre, telefono, mensaje });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Error al guardar contacto" });
  }
});

// =========================
// 404 (si no existe ruta)
// =========================
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// =========================
// PORT
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
