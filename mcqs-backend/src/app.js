const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Configuración de variables de entorno
dotenv.config();

const path = require('path');

const app = express();

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  frameguard: false,
  contentSecurityPolicy: false
})); // Seguridad de cabeceras HTTP (ajustado para permitir iframes)
app.use(cors()); // Permitir peticiones desde el frontend
app.use(express.json()); // Parsear JSON
app.use(express.urlencoded({ extended: true })); // Parsear URL-encoded

// Rate limiting deshabilitado en desarrollo para evitar bloqueos
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, 
//   max: 100, 
//   message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo después de 15 minutos'
// });
// app.use('/api/', limiter);

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me_in_production';

// Rutas de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando correctamente' });
});

// Endpoint de Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son requeridos' });

    const [users] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    const user = users[0];

    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol }, 
      JWT_SECRET, 
      { expiresIn: '8h' }
    );

    res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Middleware de Autenticación
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

// --- APLICAR MIDDLEWARE A RUTAS PROTEGIDAS ---
app.use('/api/dashboard', authMiddleware);
app.use('/api/empresas', authMiddleware);
app.use('/api/fianzas', authMiddleware);
app.use('/api/facturas', authMiddleware);

// Ruta para Dashboard Metrics (ahora protegida globalmente arriba, pero si no, se pone aquí)
app.get('/api/dashboard/metrics', async (req, res) => {
  try {
    // 1. KPIs Generales
    const [[fianzasCount]] = await db.query('SELECT COUNT(*) as total FROM fianzas');
    const [[fianzasSuma]] = await db.query("SELECT SUM(monto) as total FROM fianzas WHERE moneda = 'PEN'");
    const [[facturasCount]] = await db.query('SELECT COUNT(*) as total FROM facturas');
    
    // 2. Top 3 Fianzas Por Vencer
    const [fianzasPorVencerTop3] = await db.query(`
      SELECT f.id, f.numero, f.tipo, f.monto, f.moneda, f.fecha_vencimiento,
             DATEDIFF(f.fecha_vencimiento, CURRENT_DATE) as dias_faltantes,
             e.id as empresa_id, e.nombre as empresa_nombre,
             c.id as consorcio_id, c.nombre as consorcio_nombre
      FROM fianzas f
      LEFT JOIN empresas e ON f.empresa_id = e.id
      LEFT JOIN consorcios c ON f.consorcio_id = c.id
      WHERE f.fecha_vencimiento IS NOT NULL 
        AND DATEDIFF(f.fecha_vencimiento, CURRENT_DATE) >= 0
        AND f.estado = 'Vigente'
      ORDER BY dias_faltantes ASC
      LIMIT 3
    `);

    // 2.2 Top 3 Fianzas Vencidas
    const [fianzasVencidasTop3] = await db.query(`
      SELECT f.id, f.numero, f.tipo, f.monto, f.moneda, f.fecha_vencimiento,
             DATEDIFF(f.fecha_vencimiento, CURRENT_DATE) as dias_faltantes,
             e.id as empresa_id, e.nombre as empresa_nombre,
             c.id as consorcio_id, c.nombre as consorcio_nombre
      FROM fianzas f
      LEFT JOIN empresas e ON f.empresa_id = e.id
      LEFT JOIN consorcios c ON f.consorcio_id = c.id
      WHERE f.fecha_vencimiento IS NOT NULL 
        AND DATEDIFF(f.fecha_vencimiento, CURRENT_DATE) < 0
      ORDER BY f.fecha_vencimiento DESC
      LIMIT 3
    `);

    // 2.5 KPIs: Conteo total de Vencimientos próximos (próximos 30 días) y Vencidas
    const [[porVencerCount]] = await db.query(`
      SELECT COUNT(*) as total 
      FROM fianzas 
      WHERE fecha_vencimiento IS NOT NULL 
        AND DATEDIFF(fecha_vencimiento, CURRENT_DATE) >= 0 
        AND DATEDIFF(fecha_vencimiento, CURRENT_DATE) <= 30
        AND estado = 'Vigente'
    `);

    const [[vencidasCount]] = await db.query(`
      SELECT COUNT(*) as total 
      FROM fianzas 
      WHERE fecha_vencimiento IS NOT NULL 
        AND DATEDIFF(fecha_vencimiento, CURRENT_DATE) < 0
    `);

    // 3. Distribución por Tipos de Fianza
    const [fianzasPorTipo] = await db.query(`
      SELECT tipo as name, COUNT(*) as value, COALESCE(SUM(monto), 0) as montoTotal
      FROM fianzas 
      GROUP BY tipo
    `);

    // 5. Top 5 Empresas con mayor conteo de cartas fianza
    const [topEmpresas] = await db.query(`
      SELECT e.nombre as empresa, 
        COUNT(f.id) as total_fianzas,
        SUM(CASE WHEN f.tipo = 'fiel_cumplimiento' THEN 1 ELSE 0 END) as totalFC,
        SUM(CASE WHEN f.tipo = 'adelanto_directo' THEN 1 ELSE 0 END) as totalAD,
        SUM(CASE WHEN f.tipo = 'adelanto_materiales' THEN 1 ELSE 0 END) as totalAM
      FROM empresas e
      JOIN fianzas f ON f.empresa_id = e.id
      GROUP BY e.id
      ORDER BY total_fianzas DESC
      LIMIT 5
    `);

    // 6. Evolución Mensual (Últimos 6 meses)
    const [evolucionMensual] = await db.query(`
      SELECT DATE_FORMAT(fecha_inicio, '%Y-%m') as mes, COUNT(id) as total
      FROM fianzas
      WHERE fecha_inicio >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY mes
      ORDER BY mes ASC
    `);

    // 4. Actividad Reciente (últimas fianzas)
    const [actividadReciente] = await db.query(`
      SELECT f.id, f.numero, f.monto, f.moneda, f.estado, f.tipo, e.nombre as empresa
      FROM fianzas f
      LEFT JOIN empresas e ON f.empresa_id = e.id
      ORDER BY f.id DESC
      LIMIT 5
    `);

    // 7. Montos acumulados por moneda
    const [[montoSoles]] = await db.query("SELECT COALESCE(SUM(monto), 0) as total FROM fianzas WHERE moneda = 'PEN' AND estado = 'Vigente'");
    const [[montoDolares]] = await db.query("SELECT COALESCE(SUM(monto), 0) as total FROM fianzas WHERE moneda = 'USD' AND estado = 'Vigente'");

    res.json({
      kpis: {
        fianzasActivas: fianzasCount.total || 0,
        montoRespaldado: fianzasSuma.total || 0,
        facturasRegistradas: facturasCount.total || 0,
        vencimientosProximos: porVencerCount.total || 0,
        fianzasVencidas: vencidasCount.total || 0,
        montoSoles: montoSoles.total || 0,
        montoDolares: montoDolares.total || 0
      },
      charts: {
        fianzasTipo: fianzasPorTipo,
        evolucionMensual: evolucionMensual,
        topEmpresas: topEmpresas
      },
      fianzasPorVencerTop3: fianzasPorVencerTop3,
      fianzasVencidasTop3: fianzasVencidasTop3,
      recentActivity: actividadReciente
    });
  } catch (error) {
    console.error('Error obteniendo metrics:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para probar conexión a BD y traer empresas con tipos de fianzas
app.get('/api/empresas', async (req, res) => {
  try {
    // Sincronizar desde consorcios / expedientes a empresas si falta alguna
    try {
      await db.query(`
        INSERT INTO empresas (nombre, fecha_registro)
        SELECT DISTINCT c.nombre, NOW()
        FROM consorcios c
        WHERE NOT EXISTS (SELECT 1 FROM empresas e WHERE e.nombre = c.nombre)
      `);
      await db.query(`
        UPDATE consorcios c
        JOIN empresas e ON e.nombre = c.nombre
        SET c.empresa_id = e.id
        WHERE c.empresa_id IS NULL
      `);
    } catch (e) {}

    const query = `
      SELECT e.*, 
        (SELECT COUNT(*) FROM fianzas f WHERE f.empresa_id = e.id) as fianzasActivas,
        (SELECT COUNT(*) FROM facturas fc WHERE fc.empresa_id = e.id) as facturasActivas,
        (SELECT COUNT(*) FROM fianzas f WHERE f.empresa_id = e.id AND f.tipo = 'fiel_cumplimiento') as totalFielCumplimiento,
        (SELECT COUNT(*) FROM fianzas f WHERE f.empresa_id = e.id AND f.tipo = 'adelanto_directo') as totalAdelantoDirecto,
        (SELECT COUNT(*) FROM fianzas f WHERE f.empresa_id = e.id AND f.tipo = 'adelanto_materiales') as totalAdelantoMateriales
      FROM empresas e
      ORDER BY e.id DESC
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo empresas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para crear una nueva empresa / consorcio
app.post('/api/empresas', async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });
    const nombreLimpio = nombre.trim();

    // 1. Crear o buscar en empresas
    let empresaId = null;
    const [empExist] = await db.query('SELECT id FROM empresas WHERE nombre = ?', [nombreLimpio]);
    if (empExist.length > 0) {
      empresaId = empExist[0].id;
    } else {
      const [result] = await db.query(
        'INSERT INTO empresas (nombre, fecha_registro) VALUES (?, NOW())',
        [nombreLimpio]
      );
      empresaId = result.insertId;
    }

    // 2. Sincronizamos con consorcios
    let consorcioId = null;
    const [consExist] = await db.query('SELECT id FROM consorcios WHERE nombre = ? OR empresa_id = ?', [nombreLimpio, empresaId]);
    if (consExist.length > 0) {
      consorcioId = consExist[0].id;
    } else {
      const [consRes] = await db.query(
        'INSERT INTO consorcios (nombre, empresa_id, fecha_registro) VALUES (?, ?, NOW())', 
        [nombreLimpio, empresaId]
      );
      consorcioId = consRes.insertId;
    }

    // 3. Sincronizamos con expedientes
    const [expExist] = await db.query('SELECT id FROM expedientes WHERE nombre_proyecto = ? OR empresa_id = ?', [nombreLimpio, empresaId]);
    if (expExist.length === 0) {
      const codigoExp = 'EXP-' + Math.floor(1000 + Math.random() * 9000);
      await db.query(
        'INSERT INTO expedientes (codigo, consorcio_id, empresa_id, estado, fecha_registro, nombre_proyecto, tipo) VALUES (?, ?, ?, ?, NOW(), ?, ?)',
        [codigoExp, consorcioId, empresaId, 'Pendiente', nombreLimpio, 'Obra']
      );
    }

    res.json({ success: true, id: empresaId, message: 'Empresa creada exitosamente' });
  } catch (error) {
    console.error('Error creando empresa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Importar middleware de subida
const upload = require('./middlewares/upload');

// Endpoint para guardar una Fianza con archivo
app.post('/api/fianzas', upload.single('archivo'), async (req, res) => {
  try {
    // 1. Obtener datos del archivo (si se subió uno)
    const file = req.file;
    let archivo_id = null;

    if (file) {
      // Registrar el archivo en la BD
      const [archivoRes] = await db.query(
        `INSERT INTO archivos (nombre_original, nombre_archivo, ruta, tipo_mime, peso_bytes, modulo_origen) 
         VALUES (?, ?, ?, ?, ?, 'fianza')`,
        [file.originalname, file.filename, file.path, file.mimetype, file.size]
      );
      archivo_id = archivoRes.insertId;
    }

    // 2. Obtener datos del formulario
    const { tipo, numero, consorcio_id, monto, moneda, fecha_inicio, fecha_vencimiento, observacion } = req.body;
    
    let empresa_id = req.body.empresa_id || null;
    let validEmpresaId = null;
    if (empresa_id) {
      const [[empresaExists]] = await db.query('SELECT id FROM empresas WHERE id = ?', [empresa_id]);
      if (empresaExists) {
        validEmpresaId = empresaExists.id;
      }
    }

    let validConsorcioId = null;
    if (consorcio_id) {
      const [[consorcioExists]] = await db.query('SELECT id FROM consorcios WHERE id = ?', [consorcio_id]);
      if (consorcioExists) {
        validConsorcioId = consorcioExists.id;
      }
    }

    // 3. Guardar Fianza en la BD
    const [fianzaRes] = await db.query(
      `INSERT INTO fianzas (tipo, numero, empresa_id, consorcio_id, monto, moneda, fecha_inicio, fecha_vencimiento, archivo_id, observacion) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tipo, numero, validEmpresaId, validConsorcioId, parseFloat(monto) || 0, moneda || 'PEN', fecha_inicio || null, fecha_vencimiento || null, archivo_id, observacion || null]
    );

    res.json({ success: true, message: 'Fianza registrada exitosamente', fianzaId: fianzaRes.insertId });
  } catch (error) {
    console.error('Error guardando fianza:', error);
    res.status(500).json({ success: false, error: 'Error guardando fianza' });
  }
});

// Endpoint para listar Fianzas
app.get('/api/fianzas', async (req, res) => {
  try {
    const empresa_id = req.query.empresa_id;
    const search = req.query.search;
    let query = `
      SELECT 
        f.id, f.numero, f.tipo, f.monto, f.moneda, f.fecha_inicio, f.fecha_vencimiento, f.estado, f.observacion,
        c.nombre as consorcio, e.nombre as empresa,
        a.nombre_original as archivo_nombre, a.ruta as archivo_ruta,
        DATEDIFF(f.fecha_vencimiento, CURDATE()) as dias_faltantes,
        (SELECT COUNT(*) FROM facturas fc WHERE fc.numero_fianza = f.numero AND (fc.empresa_id = f.empresa_id OR f.empresa_id IS NULL)) as tiene_factura
      FROM fianzas f
      LEFT JOIN consorcios c ON f.consorcio_id = c.id
      LEFT JOIN empresas e ON f.empresa_id = e.id
      LEFT JOIN archivos a ON f.archivo_id = a.id
    `;
    const queryParams = [];
    const conditions = [];
    
    if (empresa_id) {
      conditions.push(`f.empresa_id = ?`);
      queryParams.push(empresa_id);
    }

    if (search) {
      conditions.push(`(f.numero LIKE ? OR f.tipo LIKE ? OR c.nombre LIKE ? OR e.nombre LIKE ?)`);
      const searchWildcard = `%${search}%`;
      queryParams.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    
    const [rows] = await db.query(query, queryParams);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo fianzas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para Dashboard de Fianzas
app.get('/api/fianzas/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // 1. Fianzas emitidas este mes
    const queryEmitidas = `
      SELECT tipo, COUNT(*) as count 
      FROM fianzas 
      WHERE MONTH(fecha_inicio) = ? AND YEAR(fecha_inicio) = ?
      GROUP BY tipo
    `;
    const [emitidasRows] = await db.query(queryEmitidas, [currentMonth, currentYear]);
    
    const emitidas = {
      total: 0,
      cumplimiento: 0,
      directo: 0,
      materiales: 0
    };

    emitidasRows.forEach(row => {
      emitidas.total += row.count;
      if (row.tipo === 'fiel_cumplimiento') emitidas.cumplimiento = row.count;
      else if (row.tipo === 'adelanto_directo') emitidas.directo = row.count;
      else if (row.tipo === 'adelanto_materiales') emitidas.materiales = row.count;
    });

    // 2. Fianzas por vencer (<= 30 días y vencidas hasta hace 1 mes)
    const queryVencer = `
      SELECT f.id, f.numero, f.tipo, f.fecha_vencimiento, e.nombre as consorcio,
             DATEDIFF(f.fecha_vencimiento, CURDATE()) as dias_faltantes
      FROM fianzas f
      LEFT JOIN empresas e ON f.empresa_id = e.id
      WHERE f.fecha_vencimiento >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
        AND f.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 1 MONTH)
      ORDER BY f.fecha_vencimiento ASC
    `;
    const [proximasVencer] = await db.query(queryVencer);

    const porVencerCount = proximasVencer.length;

    // 3. Fianzas recién añadidas (últimas 5)
    const queryRecientes = `
      SELECT f.id, f.numero, f.tipo, f.fecha_inicio, f.monto, f.moneda, e.nombre as consorcio
      FROM fianzas f
      LEFT JOIN empresas e ON f.empresa_id = e.id
      ORDER BY f.fecha_registro DESC
      LIMIT 5
    `;
    const [recientes] = await db.query(queryRecientes);

    res.json({
      emitidas,
      porVencerCount,
      proximasVencer,
      recientes
    });
  } catch (error) {
    console.error('Error obteniendo dashboard de fianzas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para guardar una Factura con archivo
app.post('/api/facturas', upload.single('archivo'), async (req, res) => {
  try {
    const file = req.file;
    let archivo_id = null;

    if (file) {
      const [archivoRes] = await db.query(
        `INSERT INTO archivos (nombre_original, nombre_archivo, ruta, tipo_mime, peso_bytes, modulo_origen) 
         VALUES (?, ?, ?, ?, ?, 'factura')`,
        [file.originalname, file.filename, file.path, file.mimetype, file.size]
      );
      archivo_id = archivoRes.insertId;
    }

    const { numero, empresa_id, monto, fecha_salida, tipo_fianza, numero_fianza, observada, detalle_observacion } = req.body;
    
    // Si no mandan empresa_id desde el form, asumimos 1 por compatibilidad temporal
    const final_empresa_id = empresa_id || 1;

    const [facturaRes] = await db.query(
      `INSERT INTO facturas (numero, empresa_id, monto, fecha_salida, tipo_fianza, numero_fianza, observada, detalle_observacion, archivo_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        numero, 
        final_empresa_id, 
        parseFloat(monto) || 0, 
        fecha_salida, 
        tipo_fianza, 
        numero_fianza, 
        observada === 'true' || observada === true ? 1 : 0, 
        detalle_observacion || null, 
        archivo_id
      ]
    );

    res.json({ success: true, message: 'Factura registrada exitosamente', facturaId: facturaRes.insertId });
  } catch (error) {
    console.error('Error guardando factura:', error);
    res.status(500).json({ success: false, error: 'Error guardando factura' });
  }
});

// Endpoint para Dashboard de Facturas (Recientemente añadidas y KPIs)
app.get('/api/facturas/dashboard', async (req, res) => {
  try {
    // 1. Obtener recientes
    const queryRecientes = `
      SELECT f.id, f.numero, f.monto, f.fecha_salida, f.tipo_fianza, f.numero_fianza, f.observada,
             e.nombre as empresa
      FROM facturas f
      LEFT JOIN empresas e ON f.empresa_id = e.id
      ORDER BY f.id DESC
      LIMIT 5
    `;
    const [recientes] = await db.query(queryRecientes);

    // 2. Calcular KPIs
    const queryKPIs = `
      SELECT 
        COUNT(id) as total_facturas,
        SUM(monto) as monto_total,
        SUM(CASE WHEN observada = 1 THEN 1 ELSE 0 END) as facturas_observadas,
        SUM(CASE WHEN MONTH(fecha_salida) = MONTH(CURRENT_DATE()) AND YEAR(fecha_salida) = YEAR(CURRENT_DATE()) THEN 1 ELSE 0 END) as emitidas_este_mes
      FROM facturas
    `;
    const [kpiRows] = await db.query(queryKPIs);
    const kpis = kpiRows[0];

    res.json({ 
      recientes,
      kpis: {
        total: kpis.total_facturas || 0,
        monto_total: kpis.monto_total || 0,
        observadas: kpis.facturas_observadas || 0,
        emitidas_mes: kpis.emitidas_este_mes || 0
      }
    });
  } catch (error) {
    console.error('Error obteniendo dashboard de facturas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para listar Facturas
app.get('/api/facturas', async (req, res) => {
  try {
    const empresa_id = req.query.empresa_id;
    const search = req.query.search;
    let query = `
      SELECT 
        f.id, f.numero, f.monto, f.fecha_salida, f.tipo_fianza, f.numero_fianza, f.observada, f.detalle_observacion,
        e.nombre as empresa,
        a.nombre_original as archivo_nombre, a.ruta as archivo_ruta
      FROM facturas f
      LEFT JOIN empresas e ON f.empresa_id = e.id
      LEFT JOIN archivos a ON f.archivo_id = a.id
    `;
    const queryParams = [];
    const conditions = [];
    
    if (empresa_id) {
      conditions.push(`f.empresa_id = ?`);
      queryParams.push(empresa_id);
    }

    if (search) {
      conditions.push(`(f.numero LIKE ? OR f.tipo_fianza LIKE ? OR f.numero_fianza LIKE ? OR e.nombre LIKE ?)`);
      const searchWildcard = `%${search}%`;
      queryParams.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    
    const [rows] = await db.query(query, queryParams);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo facturas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para traer expedientes con el nombre de su empresa y consorcio
app.get('/api/expedientes', async (req, res) => {
  try {
    // Sincronizar automáticamente cualquier empresa huérfana de la tabla empresas
    try {
      await db.query(`
        INSERT INTO empresas (nombre, fecha_registro)
        SELECT DISTINCT c.nombre, NOW()
        FROM consorcios c
        WHERE NOT EXISTS (SELECT 1 FROM empresas e WHERE e.nombre = c.nombre)
      `);
      await db.query(`
        UPDATE consorcios c
        JOIN empresas e ON e.nombre = c.nombre
        SET c.empresa_id = e.id
        WHERE c.empresa_id IS NULL
      `);
      await db.query(`
        INSERT INTO expedientes (codigo, consorcio_id, empresa_id, nombre_proyecto, estado, fecha_registro, tipo)
        SELECT CONCAT('EXP-', FLOOR(1000 + RAND() * 9000)), c.id, e.id, e.nombre, 'Pendiente', NOW(), 'Obra'
        FROM empresas e
        LEFT JOIN consorcios c ON c.empresa_id = e.id OR c.nombre = e.nombre
        WHERE NOT EXISTS (
          SELECT 1 FROM expedientes exp WHERE exp.empresa_id = e.id OR exp.nombre_proyecto = e.nombre
        )
      `);
      await db.query(`
        UPDATE expedientes exp
        JOIN empresas e ON e.nombre = exp.nombre_proyecto
        SET exp.empresa_id = e.id
        WHERE exp.empresa_id IS NULL
      `);
      await db.query(`
        UPDATE expedientes exp
        JOIN consorcios c ON c.nombre = exp.nombre_proyecto
        SET exp.consorcio_id = c.id
        WHERE exp.consorcio_id IS NULL
      `);
    } catch (syncErr) {
      console.warn('Sync notice:', syncErr.message);
    }

    const validQuery = `
      SELECT 
        e.id, 
        e.codigo, 
        e.nombre_proyecto, 
        e.estado,
        e.monto_proyecto,
        COALESCE(c.nombre, em.nombre, e.nombre_proyecto) as consorcio, 
        COALESCE(em.nombre, c.nombre, e.nombre_proyecto) as empresa
      FROM expedientes e
      LEFT JOIN consorcios c ON e.consorcio_id = c.id
      LEFT JOIN empresas em ON e.empresa_id = em.id
      ORDER BY e.id DESC
    `;
    const [rows] = await db.query(validQuery);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo expedientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para importar carpetas enteras de expedientes
app.post('/api/expedientes/import', upload.array('archivos', 2000), async (req, res) => {
  try {
    const { folderName } = req.body;
    const rutas = req.body.rutas || [];
    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({ success: false, error: 'No se recibieron archivos' });
    }

    const nombreLimpio = folderName.trim();

    // 1. Crear o buscar en empresas
    let empresaId = null;
    const [empExist] = await db.query('SELECT id FROM empresas WHERE nombre = ?', [nombreLimpio]);
    if (empExist.length > 0) {
      empresaId = empExist[0].id;
    } else {
      const [empRes] = await db.query('INSERT INTO empresas (nombre, fecha_registro) VALUES (?, NOW())', [nombreLimpio]);
      empresaId = empRes.insertId;
    }

    // 2. Crear o buscar en consorcios
    let consorcioId = null;
    const [consExist] = await db.query('SELECT id FROM consorcios WHERE nombre = ? OR empresa_id = ?', [nombreLimpio, empresaId]);
    if (consExist.length > 0) {
      consorcioId = consExist[0].id;
    } else {
      const [consRes] = await db.query('INSERT INTO consorcios (nombre, empresa_id, fecha_registro) VALUES (?, ?, NOW())', [nombreLimpio, empresaId]);
      consorcioId = consRes.insertId;
    }

    // 3. Crear o buscar expediente
    let expedienteId = null;
    const [expExist] = await db.query('SELECT id FROM expedientes WHERE nombre_proyecto = ? OR empresa_id = ?', [nombreLimpio, empresaId]);
    if (expExist.length > 0) {
      expedienteId = expExist[0].id;
    } else {
      const codigoExp = 'EXP-' + Math.floor(1000 + Math.random() * 9000);
      const [expRes] = await db.query(
        'INSERT INTO expedientes (codigo, consorcio_id, empresa_id, estado, fecha_registro, nombre_proyecto, tipo) VALUES (?, ?, ?, ?, NOW(), ?, ?)',
        [codigoExp, consorcioId, empresaId, 'Pendiente', nombreLimpio, 'Obra']
      );
      expedienteId = expRes.insertId;
    }

    // 4. Guardar todos los archivos
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const originalPath = Array.isArray(rutas) ? rutas[i] : (rutas || file.originalname);
      await db.query(
        'INSERT INTO archivos (nombre_original, nombre_archivo, ruta, tipo_mime, peso_bytes, modulo_origen, modulo_id, fecha_subida) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        [originalPath, file.filename, file.path, file.mimetype, file.size, 'expediente', expedienteId]
      );
    }

    res.json({ success: true, message: `Expediente creado y ${files.length} archivos guardados.`, expedienteId });

  } catch (error) {
    console.error('Error importando carpeta:', error);
    res.status(500).json({ success: false, error: 'Error importando carpeta' });
  }
});

// Endpoint para crear expediente manual
app.post('/api/expedientes', async (req, res) => {
  try {
    const { nombre_proyecto } = req.body;
    if (!nombre_proyecto) return res.status(400).json({ error: 'Nombre de proyecto es requerido' });
    const nombreLimpio = nombre_proyecto.trim();

    // 1. Crear o buscar en empresas
    let empresaId = null;
    const [empExist] = await db.query('SELECT id FROM empresas WHERE nombre = ?', [nombreLimpio]);
    if (empExist.length > 0) {
      empresaId = empExist[0].id;
    } else {
      const [empRes] = await db.query('INSERT INTO empresas (nombre, fecha_registro) VALUES (?, NOW())', [nombreLimpio]);
      empresaId = empRes.insertId;
    }

    // 2. Crear o buscar en consorcios
    let consorcioId = null;
    const [consExist] = await db.query('SELECT id FROM consorcios WHERE nombre = ? OR empresa_id = ?', [nombreLimpio, empresaId]);
    if (consExist.length > 0) {
      consorcioId = consExist[0].id;
    } else {
      const [consRes] = await db.query('INSERT INTO consorcios (nombre, empresa_id, fecha_registro) VALUES (?, ?, NOW())', [nombreLimpio, empresaId]);
      consorcioId = consRes.insertId;
    }

    // 3. Crear o buscar expediente
    let expedienteId = null;
    const [expExist] = await db.query('SELECT id FROM expedientes WHERE nombre_proyecto = ? OR empresa_id = ?', [nombreLimpio, empresaId]);
    if (expExist.length > 0) {
      expedienteId = expExist[0].id;
    } else {
      const codigoExp = 'EXP-' + Math.floor(1000 + Math.random() * 9000);
      const [expRes] = await db.query(
        'INSERT INTO expedientes (codigo, consorcio_id, empresa_id, estado, fecha_registro, nombre_proyecto, tipo) VALUES (?, ?, ?, ?, NOW(), ?, ?)',
        [codigoExp, consorcioId, empresaId, 'Pendiente', nombreLimpio, 'Obra']
      );
      expedienteId = expRes.insertId;
    }

    res.json({ success: true, message: 'Empresa creada exitosamente', expedienteId, empresaId, consorcioId });
  } catch (error) {
    console.error('Error creando expediente manual:', error);
    res.status(500).json({ error: 'Error interno: ' + error.message });
  }
});

// Endpoint para eliminar un expediente (empresa/consorcio)
app.delete('/api/expedientes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [expedientes] = await db.query('SELECT consorcio_id, empresa_id FROM expedientes WHERE id = ?', [id]);
    if (expedientes.length === 0) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }
    const { consorcio_id, empresa_id } = expedientes[0];

    // 1. Eliminar archivos asociados a este expediente
    await db.query('DELETE FROM archivos WHERE (modulo_origen = ? OR modulo_origen IS NULL) AND modulo_id = ?', ['expediente', id]);

    // 2. Eliminar el expediente
    await db.query('DELETE FROM expedientes WHERE id = ?', [id]);

    // 3. Eliminar consorcio si existe
    if (consorcio_id) {
      await db.query('DELETE FROM consorcios WHERE id = ?', [consorcio_id]);
    }

    // 4. Eliminar empresa si existe
    if (empresa_id) {
      await db.query('DELETE FROM empresas WHERE id = ?', [empresa_id]);
    }

    res.json({ success: true, message: 'Empresa y datos asociados eliminados correctamente' });
  } catch (error) {
    console.error('Error al eliminar el expediente/empresa:', error);
    res.status(500).json({ error: 'Error interno del servidor al eliminar la empresa' });
  }
});

// Endpoint para listar archivos de un expediente
app.get('/api/expedientes/:id/archivos', async (req, res) => {
  try {
    const { id } = req.params;
    
    try {
      await db.query('ALTER TABLE archivos ADD COLUMN modulo_origen VARCHAR(50)');
    } catch (e) {}
    try {
      await db.query('ALTER TABLE archivos ADD COLUMN modulo_id INT');
    } catch (e) {}

    // Buscar todos los IDs asociados a este expediente (id, consorcio_id, empresa_id, o expedientes con mismo nombre)
    let ids = [parseInt(id)];
    try {
      const [expedientes] = await db.query('SELECT id, consorcio_id, empresa_id, nombre_proyecto FROM expedientes WHERE id = ?', [id]);
      if (expedientes.length > 0) {
        const exp = expedientes[0];
        if (exp.consorcio_id) ids.push(exp.consorcio_id);
        if (exp.empresa_id) ids.push(exp.empresa_id);
        
        if (exp.nombre_proyecto) {
          const [similares] = await db.query('SELECT id, consorcio_id, empresa_id FROM expedientes WHERE nombre_proyecto = ?', [exp.nombre_proyecto]);
          similares.forEach(s => {
            ids.push(s.id);
            if (s.consorcio_id) ids.push(s.consorcio_id);
            if (s.empresa_id) ids.push(s.empresa_id);
          });
        }
      }
    } catch (e) {}

    ids = [...new Set(ids.filter(Boolean))];

    const [rows] = await db.query(
      'SELECT id, nombre_original, nombre_archivo, ruta, tipo_mime, peso_bytes, fecha_subida FROM archivos WHERE (modulo_origen = ? OR modulo_origen IS NULL) AND modulo_id IN (?) ORDER BY id ASC',
      ['expediente', ids]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo archivos:', error);
    res.status(500).json({ error: 'Error interno: ' + error.message });
  }
});

// Endpoint para crear una carpeta vacia
app.post('/api/expedientes/:id/carpetas', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });

    try {
      await db.query('ALTER TABLE archivos ADD COLUMN modulo_origen VARCHAR(50)');
    } catch (e) {}
    try {
      await db.query('ALTER TABLE archivos ADD COLUMN modulo_id INT');
    } catch (e) {}

    await db.query(
      'INSERT INTO archivos (nombre_original, nombre_archivo, ruta, tipo_mime, peso_bytes, modulo_origen, modulo_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [`${nombre}/.placeholder`, '.placeholder', '', 'application/x-empty', 0, 'expediente', id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error creando carpeta:', error);
    res.status(500).json({ error: 'Error interno: ' + error.message });
  }
});

// Endpoint para subir archivos a un expediente
app.post('/api/expedientes/:id/archivos', upload.array('archivos', 50), async (req, res) => {
  try {
    const { id } = req.params;
    const { carpeta } = req.body; // El nombre de la carpeta (ej. "01 DATOS DE LA OBRA")
    const files = req.files || [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const originalPath = carpeta ? `${carpeta}/${file.originalname}` : file.originalname;
      
      await db.query(
        'INSERT INTO archivos (nombre_original, nombre_archivo, ruta, tipo_mime, peso_bytes, modulo_origen, modulo_id, fecha_subida) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        [originalPath, file.filename, file.path, file.mimetype, file.size, 'expediente', id]
      );
    }

    res.json({ success: true, message: 'Archivos subidos exitosamente' });
  } catch (error) {
    console.error('Error subiendo archivos:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Endpoint para eliminar un archivo específico
app.delete('/api/archivos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM archivos WHERE id = ?', [id]);
    res.json({ success: true, message: 'Archivo eliminado' });
  } catch (error) {
    console.error('Error eliminando archivo:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Endpoint para eliminar una carpeta (y todos sus archivos) de un expediente
app.delete('/api/expedientes/:id/carpetas', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body; // Prefijo de la carpeta, ej "01 DATOS DE LA OBRA"
    
    if (!nombre) return res.status(400).json({ error: 'Nombre de carpeta requerido' });

    let ids = [parseInt(id)];
    try {
      const [expedientes] = await db.query('SELECT id, consorcio_id, empresa_id, nombre_proyecto FROM expedientes WHERE id = ?', [id]);
      if (expedientes.length > 0) {
        const exp = expedientes[0];
        if (exp.consorcio_id) ids.push(exp.consorcio_id);
        if (exp.empresa_id) ids.push(exp.empresa_id);
        
        if (exp.nombre_proyecto) {
          const [similares] = await db.query('SELECT id, consorcio_id, empresa_id FROM expedientes WHERE nombre_proyecto = ?', [exp.nombre_proyecto]);
          similares.forEach(s => {
            ids.push(s.id);
            if (s.consorcio_id) ids.push(s.consorcio_id);
            if (s.empresa_id) ids.push(s.empresa_id);
          });
        }
      }
    } catch (e) {}

    ids = [...new Set(ids.filter(Boolean))];

    // Eliminamos todos los archivos que pertenezcan a esta carpeta (exacto, con / o con prefijo)
    await db.query(
      'DELETE FROM archivos WHERE (modulo_origen = ? OR modulo_origen IS NULL) AND modulo_id IN (?) AND (nombre_original = ? OR nombre_original LIKE ? OR nombre_original LIKE ?)',
      ['expediente', ids, nombre, `${nombre}/%`, `${nombre}%`]
    );
    
    res.json({ success: true, message: 'Carpeta y su contenido eliminados exitosamente' });
  } catch (error) {
    console.error('Error eliminando carpeta:', error);
    res.status(500).json({ error: 'Error interno al eliminar carpeta: ' + error.message });
  }
});

// Endpoint para eliminar una Fianza
app.delete('/api/fianzas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM fianzas WHERE id = ?', [id]);
    res.json({ success: true, message: 'Fianza eliminada' });
  } catch (error) {
    console.error('Error eliminando fianza:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Endpoint para actualizar una Fianza
app.put('/api/fianzas/:id', upload.single('archivo'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;
    const { tipo, numero, consorcio_id, empresa_id, monto, moneda, fecha_inicio, fecha_vencimiento, observacion } = req.body;
    
    let validConsorcioId = null;
    if (consorcio_id) {
      const [[consorcioExists]] = await db.query('SELECT id FROM consorcios WHERE id = ?', [consorcio_id]);
      if (consorcioExists) {
        validConsorcioId = consorcioExists.id;
      }
    }

    let updateQuery = 'UPDATE fianzas SET tipo=?, numero=?, consorcio_id=?, monto=?, moneda=?, fecha_inicio=?, fecha_vencimiento=?, observacion=?';
    let queryParams = [tipo, numero, validConsorcioId, parseFloat(monto) || 0, moneda || 'PEN', fecha_inicio, fecha_vencimiento, observacion || null];

    if (empresa_id) {
      const [[empresaExists]] = await db.query('SELECT id FROM empresas WHERE id = ?', [empresa_id]);
      if (empresaExists) {
        updateQuery += ', empresa_id=?';
        queryParams.push(empresaExists.id);
      }
    }

    if (file) {
      const [archivoRes] = await db.query(
        `INSERT INTO archivos (nombre_original, nombre_archivo, ruta, tipo_mime, peso_bytes, modulo_origen) 
         VALUES (?, ?, ?, ?, ?, 'fianza')`,
        [file.originalname, file.filename, file.path, file.mimetype, file.size]
      );
      updateQuery += ', archivo_id=?';
      queryParams.push(archivoRes.insertId);
    }

    updateQuery += ' WHERE id=?';
    queryParams.push(id);

    await db.query(updateQuery, queryParams);
    res.json({ success: true, message: 'Fianza actualizada exitosamente' });
  } catch (error) {
    console.error('Error actualizando fianza:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Endpoint para actualizar la observación de una Fianza
app.patch('/api/fianzas/:id/observacion', async (req, res) => {
  try {
    const { id } = req.params;
    const { observacion } = req.body;
    await db.query('UPDATE fianzas SET observacion = ? WHERE id = ?', [observacion || null, id]);
    res.json({ success: true, message: 'Observación actualizada exitosamente' });
  } catch (error) {
    console.error('Error actualizando observación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para eliminar una Factura
app.delete('/api/facturas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM facturas WHERE id = ?', [id]);
    res.json({ success: true, message: 'Factura eliminada' });
  } catch (error) {
    console.error('Error eliminando factura:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Endpoint para actualizar una Factura
app.put('/api/facturas/:id', upload.single('archivo'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;
    const { numero, monto, fecha_salida, tipo_fianza, numero_fianza, observada, detalle_observacion, empresa_id } = req.body;
    
    let updateQuery = 'UPDATE facturas SET numero=?, monto=?, fecha_salida=?, tipo_fianza=?, numero_fianza=?, observada=?, detalle_observacion=?';
    let queryParams = [
      numero, 
      parseFloat(monto) || 0, 
      fecha_salida, 
      tipo_fianza, 
      numero_fianza, 
      observada === 'true' || observada === true ? 1 : 0, 
      detalle_observacion || null
    ];

    if (empresa_id) {
      updateQuery += ', empresa_id=?';
      queryParams.push(empresa_id);
    }

    if (file) {
      const [archivoRes] = await db.query(
        `INSERT INTO archivos (nombre_original, nombre_archivo, ruta, tipo_mime, peso_bytes, modulo_origen) 
         VALUES (?, ?, ?, ?, ?, 'factura')`,
        [file.originalname, file.filename, file.path, file.mimetype, file.size]
      );
      updateQuery += ', archivo_id=?';
      queryParams.push(archivoRes.insertId);
    }

    updateQuery += ' WHERE id=?';
    queryParams.push(id);

    await db.query(updateQuery, queryParams);
    res.json({ success: true, message: 'Factura actualizada exitosamente' });
  } catch (error) {
    console.error('Error actualizando factura:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// --- ENDPOINTS PARA INFORMES ---
app.use('/api/informes', authMiddleware);

app.get('/api/informes/fianzas', async (req, res) => {
  try {
    const { startDate, endDate, empresa_id, estado } = req.query;
    
    let query = `
      SELECT f.id, f.numero, f.tipo, f.monto, f.moneda, f.estado, f.fecha_inicio, f.fecha_vencimiento, 
             e.nombre as empresa, e.ruc as empresa_ruc
      FROM fianzas f
      LEFT JOIN empresas e ON f.empresa_id = e.id
      WHERE 1=1
    `;
    let params = [];

    if (startDate && endDate) {
      query += ` AND f.fecha_inicio BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    if (empresa_id) {
      query += ` AND f.empresa_id = ?`;
      params.push(empresa_id);
    }
    if (estado) {
      query += ` AND f.estado = ?`;
      params.push(estado);
    }

    query += ` ORDER BY f.fecha_registro DESC`;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error generando informe de fianzas:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/api/informes/facturas', async (req, res) => {
  try {
    const { startDate, endDate, empresa_id, observada } = req.query;
    
    let query = `
      SELECT f.id, f.numero, f.monto, f.fecha_salida, f.tipo_fianza, f.numero_fianza, f.observada, f.detalle_observacion,
             e.nombre as empresa, e.ruc as empresa_ruc
      FROM facturas f
      LEFT JOIN empresas e ON f.empresa_id = e.id
      WHERE 1=1
    `;
    let params = [];

    if (startDate && endDate) {
      query += ` AND f.fecha_salida BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    if (empresa_id) {
      query += ` AND f.empresa_id = ?`;
      params.push(empresa_id);
    }
    if (observada !== undefined && observada !== '') {
      query += ` AND f.observada = ?`;
      params.push(observada === 'true' ? 1 : 0);
    }

    query += ` ORDER BY f.fecha_registro DESC`;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error generando informe de facturas:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/api/informes/general', async (req, res) => {
  try {
    const { startDate, endDate, empresa_id } = req.query;
    
    let query = `
      SELECT e.nombre as empresa, f.tipo as tipo_carta, f.numero as numero_carta_fianza, 
             f.monto as monto_carta, f.fecha_inicio, f.fecha_vencimiento as fecha_fin, 
             fa.numero as factura, fa.monto as monto_factura
      FROM fianzas f
      LEFT JOIN facturas fa ON f.numero = fa.numero_fianza
      LEFT JOIN empresas e ON f.empresa_id = e.id
      WHERE 1=1
    `;
    let params = [];

    if (startDate && endDate) {
      query += ` AND f.fecha_inicio BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    if (empresa_id) {
      query += ` AND f.empresa_id = ?`;
      params.push(empresa_id);
    }

    query += ` ORDER BY f.fecha_registro DESC`;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error generando informe general:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});


// --- BÚSQUEDA GLOBAL EXPERTA ---
app.get('/api/search/obligaciones', async (req, res) => {
  try {
    const [fianzasUrgentes] = await db.query(`
      SELECT f.id, f.numero, f.tipo, f.monto, f.moneda, f.fecha_vencimiento,
             DATEDIFF(f.fecha_vencimiento, CURRENT_DATE) as dias_faltantes,
             e.id as empresa_id, e.nombre as empresa_nombre,
             c.id as consorcio_id, c.nombre as consorcio_nombre
      FROM fianzas f
      LEFT JOIN empresas e ON f.empresa_id = e.id
      LEFT JOIN consorcios c ON f.consorcio_id = c.id
      WHERE f.fecha_vencimiento IS NOT NULL
        AND f.estado = 'Vigente'
        AND DATEDIFF(f.fecha_vencimiento, CURRENT_DATE) >= 0
        AND DATEDIFF(f.fecha_vencimiento, CURRENT_DATE) <= 30
      ORDER BY dias_faltantes ASC
      LIMIT 4
    `);

    const [facturasObservadas] = await db.query(`
      SELECT f.id, f.numero, f.monto, f.fecha_salida, f.observada, f.tipo_fianza, f.detalle_observacion,
             e.id as empresa_id, e.nombre as empresa_nombre
      FROM facturas f
      LEFT JOIN empresas e ON f.empresa_id = e.id
      WHERE f.observada = 1
      ORDER BY f.id DESC
      LIMIT 4
    `);

    res.json({
      fianzasUrgentes,
      facturasObservadas
    });
  } catch (error) {
    console.error('Error en obligaciones search:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json({ empresas: [], fianzas: [], expedientes: [], facturas: [], cargos: [] });
  
  const searchPattern = `%${query.trim()}%`;
  
  try {
    const [empresasData] = await db.query(
      `SELECT e.id, e.nombre, e.ruc,
              (SELECT COUNT(*) FROM fianzas f WHERE f.empresa_id = e.id) as fianzasActivas,
              (SELECT COUNT(*) FROM facturas fc WHERE fc.empresa_id = e.id) as facturasActivas
       FROM empresas e 
       WHERE e.nombre LIKE ? OR e.ruc LIKE ? 
       LIMIT 8`,
      [searchPattern, searchPattern]
    );
    const [consorciosData] = await db.query(
      `SELECT c.id, c.nombre, 'Consorcio' as ruc,
              (SELECT COUNT(*) FROM fianzas f WHERE f.consorcio_id = c.id) as fianzasActivas,
              0 as facturasActivas
       FROM consorcios c 
       WHERE c.nombre LIKE ? 
       LIMIT 8`,
      [searchPattern]
    );
    const empresas = [...empresasData, ...consorciosData].slice(0, 8);

    const [fianzas] = await db.query(
      `SELECT f.id, f.numero, f.tipo, f.estado, f.monto, f.moneda, f.fecha_vencimiento, f.observacion,
              DATEDIFF(f.fecha_vencimiento, CURRENT_DATE) as dias_faltantes,
              e.id as empresa_id, e.nombre as empresa_nombre, e.ruc as empresa_ruc,
              c.id as consorcio_id, c.nombre as consorcio_nombre
       FROM fianzas f
       LEFT JOIN empresas e ON f.empresa_id = e.id
       LEFT JOIN consorcios c ON f.consorcio_id = c.id
       WHERE f.numero LIKE ? OR f.tipo LIKE ? OR e.nombre LIKE ? OR c.nombre LIKE ?
       ORDER BY f.id DESC
       LIMIT 8`,
      [searchPattern, searchPattern, searchPattern, searchPattern]
    );

    const [expedientes] = await db.query(
      'SELECT id, codigo, nombre_proyecto, estado, fecha_ingreso FROM expedientes WHERE codigo LIKE ? OR nombre_proyecto LIKE ? ORDER BY id DESC LIMIT 8',
      [searchPattern, searchPattern]
    );

    const [facturas] = await db.query(
      `SELECT f.id, f.numero, f.numero_fianza, f.monto, f.fecha_salida, f.observada, f.tipo_fianza, f.detalle_observacion,
              e.id as empresa_id, e.nombre as empresa_nombre, e.ruc as empresa_ruc
       FROM facturas f
       LEFT JOIN empresas e ON f.empresa_id = e.id
       WHERE f.numero LIKE ? OR f.numero_fianza LIKE ? OR e.nombre LIKE ?
       ORDER BY f.id DESC
       LIMIT 8`,
      [searchPattern, searchPattern, searchPattern]
    );

    const [cargos] = await db.query(
      `SELECT c.id, c.codigo, c.tipo, c.destinatario, c.asunto, c.descripcion, c.fecha_registro_cargo
       FROM cargos c
       WHERE c.codigo LIKE ? OR c.destinatario LIKE ? OR c.asunto LIKE ? OR c.descripcion LIKE ?
       ORDER BY c.id DESC
       LIMIT 8`,
      [searchPattern, searchPattern, searchPattern, searchPattern]
    );
    
    res.json({
      empresas,
      fianzas,
      expedientes,
      facturas,
      cargos
    });
  } catch (error) {
    console.error('Error en búsqueda global:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// --- RUTAS DE CARGOS ---
app.get('/api/cargos', authMiddleware, async (req, res) => {
  try {
    const { tipo } = req.query;
    let query = `SELECT c.* FROM cargos c`;
    let params = [];
    if (tipo) {
      query += ' WHERE c.tipo = ? ORDER BY c.id DESC';
      params.push(tipo);
    } else {
      query += ' ORDER BY c.id DESC';
    }
    const [cargos] = await db.query(query, params);

    if (cargos.length > 0) {
      const cargoIds = cargos.map(c => c.id);
      
      const [archivos] = await db.query(
        `SELECT id, nombre_original as archivo_nombre, ruta as archivo_ruta, modulo_id 
         FROM archivos 
         WHERE modulo_origen = 'cargo' AND modulo_id IN (?)`,
        [cargoIds]
      );
      
      const legacyIds = cargos.filter(c => c.archivo_id).map(c => c.archivo_id);
      let legacyArchivos = [];
      if (legacyIds.length > 0) {
         const [lArchivos] = await db.query(
           `SELECT id, nombre_original as archivo_nombre, ruta as archivo_ruta 
            FROM archivos 
            WHERE id IN (?)`,
           [legacyIds]
         );
         legacyArchivos = lArchivos;
      }

      cargos.forEach(c => {
        c.archivos = archivos.filter(a => a.modulo_id === c.id);
        
        if (c.archivos.length === 0 && c.archivo_id) {
           const l = legacyArchivos.find(la => la.id === c.archivo_id);
           if (l) {
             c.archivos = [l];
             c.archivo_nombre = l.archivo_nombre;
             c.archivo_ruta = l.archivo_ruta;
           }
        } else if (c.archivos.length > 0) {
           c.archivo_nombre = c.archivos[0].archivo_nombre;
           c.archivo_ruta = c.archivos[0].archivo_ruta;
        }
      });
    }

    res.json(cargos);
  } catch (error) {
    console.error('Error obteniendo cargos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/cargos', authMiddleware, upload.array('archivos', 10), async (req, res) => {
  try {
    const files = req.files || [];
    const { tipo, descripcion, destinatario, remitente, asunto, fecha_registro_cargo, usuario_registro } = req.body;
    
    const [rows] = await db.query('SELECT COUNT(*) as total FROM cargos');
    const codigo = `CRG-00${rows[0].total + 1}`;

    const [result] = await db.query(
      `INSERT INTO cargos (codigo, tipo, descripcion, destinatario, remitente, asunto, fecha_registro_cargo, usuario_registro)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, tipo, descripcion, destinatario, remitente, asunto, fecha_registro_cargo, usuario_registro]
    );
    
    const cargo_id = result.insertId;
    let primer_archivo_id = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const [archivoRes] = await db.query(
        `INSERT INTO archivos (nombre_original, nombre_archivo, ruta, tipo_mime, peso_bytes, modulo_origen, modulo_id) 
         VALUES (?, ?, ?, ?, ?, 'cargo', ?)`,
        [file.originalname, file.filename, file.path, file.mimetype, file.size, cargo_id]
      );
      if (i === 0) {
        primer_archivo_id = archivoRes.insertId;
      }
    }

    if (primer_archivo_id) {
       await db.query(`UPDATE cargos SET archivo_id = ? WHERE id = ?`, [primer_archivo_id, cargo_id]);
    }

    res.json({ success: true, id: cargo_id, codigo });
  } catch (error) {
    console.error('Error insertando cargo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/api/cargos/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, destinatario, remitente, asunto, fecha_registro_cargo, usuario_registro } = req.body;
    
    await db.query(
      `UPDATE cargos 
       SET descripcion = ?, destinatario = ?, remitente = ?, asunto = ?, fecha_registro_cargo = ?, usuario_registro = ?
       WHERE id = ?`,
      [descripcion, destinatario, remitente, asunto, fecha_registro_cargo, usuario_registro, id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error actualizando cargo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/api/cargos/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM archivos WHERE (modulo_origen = ? OR modulo_origen IS NULL) AND modulo_id = ?', ['cargo', id]);
    await db.query('DELETE FROM cargos WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando cargo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Proxy API to fetch Government Regional Huánuco (GOREHCO) tramite details natively
app.get('/api/tramites/gorehco/:expedienteId', async (req, res) => {
  try {
    const { expedienteId } = req.params;
    const axios = require('axios');
    
    // Consultamos directamente el endpoint API JSON oficial del GOREHCO para el expediente
    const gorehcoApiUrl = `https://digital.regionhuanuco.gob.pe/tramite/expediente?iddocumento=${encodeURIComponent(expedienteId)}`;
    const response = await axios.get(gorehcoApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });

    const listado = response.data;
    let detallePrimerDocumento = null;
    
    // Consultamos de forma automática el primer registro (más reciente)
    if (Array.isArray(listado) && listado.length > 0) {
      try {
        const iddoc = listado[0].iddocumento;
        const detailUrl = `https://digital.regionhuanuco.gob.pe/tramite/documento/buscarDocumento?iddocumento=${iddoc}`;
        const detailRes = await axios.get(detailUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
          }
        });
        detallePrimerDocumento = detailRes.data;
      } catch (err) {
        console.error('Error fetching first document details:', err.message);
      }
    }

    res.json({
      success: true,
      expediente: expedienteId,
      listado: listado,
      detallePrimerDocumento: detallePrimerDocumento,
      webUrl: `https://digital.regionhuanuco.gob.pe/registro/mpv/obs/3?expediente=${expedienteId}`
    });
  } catch (error) {
    console.error('Error in GOREHCO proxy route:', error.message);
    res.status(500).json({ error: 'Error interno al consultar el trámite' });
  }
});

// Proxy para obtener los detalles de movimientos de un documento específico
app.get('/api/tramites/gorehco/documento/:iddocumento', async (req, res) => {
  try {
    const { iddocumento } = req.params;
    const axios = require('axios');
    const detailUrl = `https://digital.regionhuanuco.gob.pe/tramite/documento/buscarDocumento?iddocumento=${iddocumento}`;
    
    const detailRes = await axios.get(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    
    res.json({
      success: true,
      detalle: detailRes.data
    });
  } catch (error) {
    console.error('Error fetching deep document details:', error.message);
    res.status(500).json({ error: 'Error al obtener el historial del documento' });
  }
});

// --- ENDPOINTS DE CONSULTA PERUDEVS (DNI Y RUC) ---
const PERUDEVS_API_KEY = process.env.PERUDEVS_API_KEY || 'cGVydWRldnMucHJvZHVjdGlvbi5maXRjb2RlcnMuNjk5NDlhYWEwNGEyNjc2MDk2ZjkzZDEz';

app.get('/api/consultas/dni/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    if (!dni || dni.length !== 8) {
      return res.status(400).json({ error: 'El DNI debe tener 8 dígitos numéricos' });
    }

    const axios = require('axios');
    const url = `https://api.perudevs.com/api/v1/dni/complete?document=${dni}&key=${PERUDEVS_API_KEY}`;
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.data && response.data.estado) {
      return res.json({ success: true, data: response.data.resultado });
    } else {
      return res.status(404).json({ error: response.data?.mensaje || 'DNI no encontrado' });
    }
  } catch (error) {
    console.error('Error consultando DNI en PeruDevs:', error.response?.data || error.message);
    const msg = error.response?.data?.mensaje || error.response?.data?.error || 'Error al consultar DNI con RENIEC';
    return res.status(error.response?.status || 500).json({ error: msg });
  }
});

app.get('/api/consultas/ruc/:ruc', async (req, res) => {
  try {
    const { ruc } = req.params;
    if (!ruc || ruc.length !== 11) {
      return res.status(400).json({ error: 'El RUC debe tener 11 dígitos numéricos' });
    }

    const axios = require('axios');
    const url = `https://api.perudevs.com/api/v1/ruc?document=${ruc}&key=${PERUDEVS_API_KEY}`;
    const response = await axios.get(url, { timeout: 12000 });
    
    if (response.data && response.data.estado) {
      return res.json({ success: true, data: response.data.resultado });
    } else {
      return res.status(404).json({ error: response.data?.mensaje || 'RUC no encontrado' });
    }
  } catch (error) {
    console.error('Error consultando RUC en PeruDevs:', error.response?.data || error.message);
    const msg = error.response?.data?.mensaje || error.response?.data?.error || 'Error al consultar RUC con SUNAT';
    return res.status(error.response?.status || 500).json({ error: msg });
  }
});

// --- AUTO INICIALIZACIÓN DE TABLAS Y USUARIOS EN LA NUBE ---
async function initDatabase() {
  try {
    // 1. Usuarios
    await db.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(50) DEFAULT 'admin',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Empresas
    await db.query(`
      CREATE TABLE IF NOT EXISTS empresas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        ruc VARCHAR(20),
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Consorcios
    await db.query(`
      CREATE TABLE IF NOT EXISTS consorcios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        empresa_id INT,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Archivos
    await db.query(`
      CREATE TABLE IF NOT EXISTS archivos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre_original VARCHAR(255) NOT NULL,
        nombre_archivo VARCHAR(255) NOT NULL,
        ruta VARCHAR(500) NOT NULL,
        tipo_mime VARCHAR(100),
        peso_bytes BIGINT,
        modulo_origen VARCHAR(50),
        modulo_id INT,
        fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try {
      await db.query('ALTER TABLE archivos ADD COLUMN modulo_origen VARCHAR(50)');
    } catch (e) {}
    try {
      await db.query('ALTER TABLE archivos ADD COLUMN modulo_id INT');
    } catch (e) {}

    // 5. Expedientes
    await db.query(`
      CREATE TABLE IF NOT EXISTS expedientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(50) NOT NULL,
        nombre_proyecto VARCHAR(500) NOT NULL,
        tipo VARCHAR(100) NOT NULL,
        empresa_id INT,
        consorcio_id INT,
        fecha_ingreso DATE,
        estado VARCHAR(50) DEFAULT 'Pendiente',
        archivo_id INT,
        monto_proyecto DECIMAL(15, 2) DEFAULT 0,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try {
      await db.query('ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS monto_proyecto DECIMAL(15, 2) DEFAULT 0');
      await db.query('ALTER TABLE expedientes MODIFY COLUMN estado VARCHAR(50) DEFAULT "Pendiente"');
    } catch (e) {}

    // 6. Fianzas
    await db.query(`
      CREATE TABLE IF NOT EXISTS fianzas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tipo VARCHAR(100) NOT NULL,
        numero VARCHAR(100) NOT NULL,
        empresa_id INT,
        consorcio_id INT,
        monto DECIMAL(15, 2) NOT NULL,
        moneda VARCHAR(10) DEFAULT 'PEN',
        fecha_inicio DATE,
        fecha_vencimiento DATE,
        estado VARCHAR(50) DEFAULT 'Vigente',
        observacion TEXT,
        archivo_id INT,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Facturas
    await db.query(`
      CREATE TABLE IF NOT EXISTS facturas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero VARCHAR(100) NOT NULL,
        empresa_id INT,
        monto DECIMAL(15, 2) NOT NULL,
        moneda VARCHAR(10) DEFAULT 'PEN',
        fecha_salida DATE,
        tipo_fianza VARCHAR(100),
        numero_fianza VARCHAR(100),
        observada BOOLEAN DEFAULT FALSE,
        detalle_observacion TEXT,
        archivo_id INT,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. Cargos
    await db.query(`
      CREATE TABLE IF NOT EXISTS cargos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(50) NOT NULL,
        tipo VARCHAR(100) NOT NULL,
        descripcion TEXT,
        destinatario VARCHAR(150),
        remitente VARCHAR(150),
        asunto TEXT,
        fecha_registro_cargo DATE,
        usuario_registro VARCHAR(100),
        archivo_id INT,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. Verificar y crear usuario Admin por defecto
    const [adminExists] = await db.query('SELECT id FROM usuarios WHERE email = ?', ['admin@mcqs.com']);
    if (adminExists.length === 0) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      await db.query(
        'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
        ['Administrador', 'admin@mcqs.com', hashedPassword, 'admin']
      );
      console.log('✅ Usuario Administrador inicial creado (admin@mcqs.com / admin)');
    }

    // 10. Crear trabajadores por defecto
    const defaultWorkers = [
      { nombre: 'Michael Cesar Quispe Sebastian', email: 'mquispe@mcqs.com', plainPass: 'Mcqs.Promotor$26', rol: 'PROMOTOR' },
      { nombre: 'Olimpio Escalante', email: 'oescalante@mcqs.com', plainPass: 'Mcqs.Asistente$26_O', rol: 'ASISTENTE' },
      { nombre: 'Maylin Quispe', email: 'maylin.q@mcqs.com', plainPass: 'Mcqs.Asistente$26_M', rol: 'ASISTENTE' },
      { nombre: 'Brayan Almerco', email: 'balmerco@mcqs.com', plainPass: 'Mcqs.Asistente$26_B', rol: 'ASISTENTE' },
      { nombre: 'Ruth Rojas', email: 'rrojas@mcqs.com', plainPass: 'Mcqs.Asistente$26_R', rol: 'ASISTENTE' }
    ];

    for (const worker of defaultWorkers) {
      const [wExists] = await db.query('SELECT id FROM usuarios WHERE email = ?', [worker.email]);
      if (wExists.length === 0) {
        const passHash = await bcrypt.hash(worker.plainPass, 10);
        await db.query(
          'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
          [worker.nombre, worker.email, passHash, worker.rol]
        );
      }
    }

    console.log('✅ Base de datos inicializada correctamente.');
  } catch (err) {
    console.error('⚠️ Error inicializando estructura de base de datos:', err.message);
  }
}

// --- INICIAR SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  await initDatabase();
});
