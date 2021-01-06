const express = require("express");
const { verificaToken } = require("../midlewares/autenticacion");

let app = express();
let Producto = require("../models/producto");

//Obtener todos los productos
app.get("/productos", verificaToken, (req, res) => {
  //Trae todos los productos
  //Populate usuario y categoría
  //Paginado
  let desde = req.query.desde || 0;
  desde = Number(desde);
  let limite = req.query.limite || 10;
  limite = Number(limite);
  Producto.find({ disponible: true })
    .skip(desde)
    .limit(limite)
    .populate("usuario", "nombre email")
    .populate("categoria", "descripcion")
    .exec((err, productos) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          err,
        });
      }
      res.json({
        ok: true,
        productos,
      });
    });
});

//Obtener producto por id
app.get("/productos/:id", verificaToken, (req, res) => {
  //Populate usuario y categoría
  let id = req.params.id;
  Producto.findById(id)
    .populate("usuario", "nombre email")
    .populate("categoria", "descripcion")
    .exec((err, productoDB) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          err,
        });
      }
      if (!productoDB) {
        return res.status(400).json({
          ok: false,
          err: {
            message: "Producto no encontrado",
          },
        });
      }
      res.json({
        ok: true,
        producto: productoDB,
      });
    });
});

//Buscar Productos
app.get("/productos/buscar/:termino", verificaToken, (req, res) => {
  let termino = req.params.termino;
  //RegExp i para ser insensible con las mayus y minus
  let regex = new RegExp(termino, "i");

  Producto.find({ nombre: regex })
    .populate("categoria", "descripcion")
    .exec((err, productos) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          err,
        });
      }
      res.json({
        ok: true,
        productos,
      });
    });
});

//Crear producto
app.post("/productos/", verificaToken, (req, res) => {
  //Grabar usuario y categoría
  let body = req.body;
  let producto = new Producto({
    usuario: req.usuario._id,
    nombre: body.nombre,
    precioUni: body.precioUni,
    descripcion: body.descripcion,
    disponible: body.disponible,
    categoria: body.categoria,
  });
  producto.save((err, productoDB) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        err,
      });
    }
    res.status(201).json({
      ok: true,
      producto: productoDB,
    });
  });
});

//Actualizar producto
app.put("/productos/:id", verificaToken, (req, res) => {
  //Populate usuario y categoría
  let id = req.params.id;
  let body = req.body;
  let updateProd = {
    nombre: body.nombre,
    precioUni: body.precioUni,
    descripcion: body.descripcion,
    disponible: body.disponible,
    categoria: body.categoria,
  };
  Producto.findByIdAndUpdate(
    id,
    updateProd,
    { new: true, runValidators: true, context: "query" },
    (err, productoDB) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          err,
        });
      }
      if (!productoDB) {
        return res.status(400).json({
          ok: false,
          err,
        });
      }
      res.json({
        ok: true,
        producto: productoDB,
      });
    }
  );
});

//Borrar producto
app.delete("/productos/:id", verificaToken, (req, res) => {
  //Populate usuario y categoría
  //Disponible pase a falso
  let id = req.params.id;

  let noDisponible = { disponible: false };

  Producto.findByIdAndUpdate(
    id,
    noDisponible,
    { new: true, context: "query" },
    (err, productoBorrado) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          err,
        });
      }

      if (!productoBorrado) {
        return res.status(400).json({
          ok: false,
          err: {
            message: "Producto no encontrado",
          },
        });
      }
      res.json({
        ok: true,
        producto: productoBorrado,
      });
    }
  );
});

module.exports = app;
