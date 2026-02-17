require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Propiedad = require("./models/Propiedad");
const Contacto = require("./models/Contacto");

const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");

const app = express();

// =========================
// CARPETA DE UPLOADS
// =========================
const UPLOADS_DIR = "./uploads";
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// =========================
// MULTER (manejo de archivos)
// =========================
const storage = multer.memoryStorage();
const upload = multer({ storage });

// =========================
// MIDDLEWARES
// =========================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

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
// RUTA PRINCIPAL
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
  } catch {
    res.status(500).json({ error: "Error al obtener propiedades" });
  }
});

// =====================================================
// 🔥 POST JSON (USADO POR TU ADMIN → SOLUCIÓN DEFINITIVA)
// =====================================================
app.post("/api/propiedades", async (req, res) => {
  try {
    const data = req.body;

    const terrenoM2 =
      data.terrenoM2 !== undefined && data.terrenoM2 !== null && data.terrenoM2 !== ""
        ? Number(data.terrenoM2)
        : null;

    const construccionM2 =
      data.construccionM2 !== undefined && data.construccionM2 !== null && data.construccionM2 !== ""
        ? Number(data.construccionM2)
        : null;

    const imagenes = Array.isArray(data.imagenes) ? data.imagenes : [];

    const last = await Propiedad.findOne().sort({ id: -1 });
    const nextId = last ? last.id + 1 : 1;

    const nueva = await Propiedad.create({
      titulo: data.titulo,
      tipo: data.tipo,
      zona: data.zona,
      precio: data.precio,
      descripcion: data.descripcion,
      terrenoM2,
      construccionM2,
      imagenes,
      id: nextId,
    });

    res.json(nueva);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al crear propiedad" });
  }
});

// =====================================================
// POST CON IMAGEN (MULTER) – NO SE USA PERO SE CONSERVA
// =====================================================
app.post("/api/propiedades/upload", upload.single("imagen"), async (req, res) => {
  try {
    const data = req.body.data ? JSON.parse(req.body.data) : req.body;

    data.terrenoM2 = data.terrenoM2 ? Number(data.terrenoM2) : null;
    data.construccionM2 = data.construccionM2 ? Number(data.construccionM2) : null;

    let imageName = null;

    if (req.file) {
      const buffer = await sharp(req.file.buffer)
        .jpeg({ quality: 90 })
        .toBuffer();

      imageName = `propiedad_${Date.now()}.jpg`;
      fs.writeFileSync(`${UPLOADS_DIR}/${imageName}`, buffer);
    }

    if (!Array.isArray(data.imagenes)) data.imagenes = [];
    if (imageName) data.imagenes.push(imageName);

    const last = await Propiedad.findOne().sort({ id: -1 });
    const nextId = last ? last.id + 1 : 1;

    const nueva = await Propiedad.create({
      ...data,
      id: nextId,
    });

    res.json(nueva);
  } catch (e) {
    res.status(500).json({ error: "Error al crear propiedad con imagen" });
  }
});

// =========================
// PUT (editar)
// =========================
app.put("/api/propiedades/:id", async (req, res) => {
  try {
    const param = req.params.id;
    const body = { ...req.body };

    if (body.terrenoM2 !== undefined)
      body.terrenoM2 = body.terrenoM2 ? Number(body.terrenoM2) : null;

    if (body.construccionM2 !== undefined)
      body.construccionM2 = body.construccionM2 ? Number(body.construccionM2) : null;

    const updated = !isNaN(Number(param))
      ? await Propiedad.findOneAndUpdate({ id: Number(param) }, body, { new: true })
      : await Propiedad.findByIdAndUpdate(param, body, { new: true });

    if (!updated) return res.status(404).json({ error: "No encontrada" });

    res.json(updated);
  } catch {
    res.status(500).json({ error: "Error al actualizar propiedad" });
  }
});

// =========================
// DELETE
// =========================
app.delete("/api/propiedades/:id", async (req, res) => {
  try {
    const param = req.params.id;

    const deleted = !isNaN(Number(param))
      ? await Propiedad.findOneAndDelete({ id: Number(param) })
      : await Propiedad.findByIdAndDelete(param);

    if (!deleted) return res.status(404).json({ error: "No encontrada" });

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Error al eliminar propiedad" });
  }
});

// Eliminar todo
app.delete("/api/propiedades", async (req, res) => {
  try {
    await Propiedad.deleteMany({});
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Error al vaciar propiedades" });
  }
});

// =========================
// API CONTACTO
// =========================
app.post("/api/contacto", async (req, res) => {
  try {
    const { nombre, telefono, mensaje } = req.body;
    if (!nombre || !telefono || !mensaje)
      return res.status(400).json({ error: "Faltan campos" });

    await Contacto.create({ nombre, telefono, mensaje });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Error al guardar contacto" });
  }
});

// =========================
// 404
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
