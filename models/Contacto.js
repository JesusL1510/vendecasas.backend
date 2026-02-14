const mongoose = require("mongoose");

const ContactoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    telefono: { type: String, required: true },
    mensaje: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contacto", ContactoSchema);
