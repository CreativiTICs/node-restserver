const express = require("express");
const fileUpload = require("express-fileupload");
const app = express();

const Usuario = require("../models/usuario");
const Producto = require("../models/producto");

const fs = require("fs");
const path = require("path");

app.use(fileUpload({ useTempFiles: true, tempFileDir: "/uploads/" }));

app.put("/upload/:tipo/:id", function (req, res) {
  let tipo = req.params.tipo;
  let id = req.params.id;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({
      ok: false,
      err: {
        message: "Ningún archivo ha sido cargado.",
      },
    });
  }

  //Validar tipo
  let tiposValidos = ["productos", "usuarios"];
  if (tiposValidos.indexOf(tipo) < 0) {
    return res.status(400).json({
      ok: false,
      err: {
        message: `Los extensiones permitidos son ${tiposValidos.join(", ")}`,
        tipo: tipo,
      },
    });
  }

  let archivo = req.files.archivo;
  let nombreCambiado = archivo.name.split(".");
  let extension = nombreCambiado[nombreCambiado.length - 1];

  //Extensiones permitidas
  let extensionesValidas = ["png", "jpg", "gif", "jpeg"];

  if (extensionesValidas.indexOf(extension) < 0) {
    return res.status(400).json({
      ok: false,
      err: {
        message: `Las extensiones permitidas son ${extensionesValidas.join(
          ", "
        )}`,
        ext: extension,
      },
    });
  }

  //Cambiar el nombre al archivo
  let nombreArchivo = `${id}-${new Date().getMilliseconds()}.${extension}`;

  archivo.mv(`uploads/${tipo}/${nombreArchivo}`, (err) => {
    if (err)
      return res.status(500).json({
        ok: false,
        err,
      });

    //Actualizar imágen cargada
    if (tipo === "productos") {
      imagenProducto(id, res, nombreArchivo);
    } else {
      imagenUsuario(id, res, nombreArchivo);
    }
  });
});

function imagenUsuario(id, res, nombreArchivo) {
  Usuario.findById(id, (err, usuarioDB) => {
    if (err) {
      borraArchivo(nombreArchivo, "usuarios");
      return res.status(500).json({
        ok: false,
        err,
      });
    }
    if (!usuarioDB) {
      borraArchivo(nombreArchivo, "usuarios");
      return res.status(400).json({
        ok: false,
        err: {
          message: "Usuario no existe ",
        },
      });
    }
    //Para borrar los archivos que subimos del uploads/tipo
    borraArchivo(usuarioDB.img, "usuarios");

    usuarioDB.img = nombreArchivo;
    usuarioDB.save((err, usuarioSave) => {
      res.json({
        ok: true,
        usuario: usuarioSave,
        img: nombreArchivo,
      });
    });
  });
}

function imagenProducto(id, res, nombreArchivo) {
  Producto.findById(id, (err, productoDB) => {
    if (err) {
      borraArchivo(nombreArchivo, "productos");
      return res.status(500).json({
        ok: false,
        err,
      });
    }
    if (!productoDB) {
      borraArchivo(nombreArchivo, "productos");
      return res.status(400).json({
        ok: false,
        err: {
          message: "Producto no existe ",
        },
      });
    }
    //Para borrar los archivos que subimos del uploads/tipo
    borraArchivo(productoDB.img, "productos");

    productoDB.img = nombreArchivo;
    productoDB.save((err, productoSave) => {
      res.json({
        ok: true,
        producto: productoSave,
        img: nombreArchivo,
      });
    });
  });
}

function borraArchivo(nombreArchivo, tipo) {
  let pathImg = path.resolve(
    __dirname,
    `../../uploads/${tipo}/${nombreArchivo}`
  );

  if (fs.existsSync(pathImg)) {
    fs.unlinkSync(pathImg);
  }
}

module.exports = app;
