const mongoose = require("mongoose");

const PropiedadSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true }, // tu id numérico
    titulo: { type: String, required: true },
    tipo: { type: String, enum: ["Venta", "Traspaso"], required: true },
    zona: { type: String, required: true },
    precio: { type: String, required: true },
    terrenoM2: { type: Number, default: null },
construccionM2: { type: Number, default: null },
    descripcion: { type: String, required: true },
    imagenes: { type: [String], default: [] } // base64 tal cual
  },
  { timestamps: true }
);

module.exports = mongoose.model("Propiedad", PropiedadSchema);
