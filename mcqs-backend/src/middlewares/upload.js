const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de almacenamiento base
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determinar la carpeta según el tipo (fianzas, facturas, cargos, expedientes)
    // El frontend debe enviar un campo 'modulo' en el form data, o podemos deducirlo de la URL
    let folder = 'uploads/';
    
    if (req.path.includes('fianzas')) folder += 'fianzas/';
    else if (req.path.includes('facturas')) folder += 'facturas/';
    else if (req.path.includes('cargos')) folder += 'cargos/';
    else if (req.path.includes('expedientes')) folder += 'expedientes/';

    // Crear carpeta si no existe
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    // Generar un nombre único para evitar sobreescrituras
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 100 * 1024 * 1024, // Aumentado a 100MB por archivo
    fieldSize: 50 * 1024 * 1024, // Aumentado a 50MB para campos de texto como rutas muy largas
    files: 2000 // Permitir hasta 2000 archivos por lote
  },
});

module.exports = upload;
