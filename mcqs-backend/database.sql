-- Script de creación de Base de Datos y Tablas para MCQS Sistema

CREATE DATABASE IF NOT EXISTS mcqs_db;
USE mcqs_db;

-- 1. Empresas
CREATE TABLE IF NOT EXISTS empresas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    ruc VARCHAR(20),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Consorcios
CREATE TABLE IF NOT EXISTS consorcios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    empresa_id INT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL
);

-- 3. Archivos (Centralizada para metadatos de documentos)
CREATE TABLE IF NOT EXISTS archivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_original VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta VARCHAR(500) NOT NULL,
    tipo_mime VARCHAR(100),
    peso_bytes BIGINT,
    modulo_origen VARCHAR(50), -- ej: 'expediente', 'fianza', 'factura', 'cargo'
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Expedientes
CREATE TABLE IF NOT EXISTS expedientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre_proyecto VARCHAR(500) NOT NULL,
    tipo VARCHAR(100) NOT NULL, -- ej: 'Obra', 'Servicio'
    empresa_id INT,
    consorcio_id INT,
    fecha_ingreso DATE,
    estado ENUM('Pendiente', 'En Revisión', 'Aprobado', 'Rechazado', 'Completado') DEFAULT 'Pendiente',
    archivo_id INT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL,
    FOREIGN KEY (consorcio_id) REFERENCES consorcios(id) ON DELETE SET NULL,
    FOREIGN KEY (archivo_id) REFERENCES archivos(id) ON DELETE SET NULL
);

-- 5. Fianzas
CREATE TABLE IF NOT EXISTS fianzas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(100) NOT NULL, -- ej: 'Fiel Cumplimiento', 'Adelanto Directo'
    numero VARCHAR(100) NOT NULL,
    empresa_id INT,
    consorcio_id INT,
    monto DECIMAL(15, 2) NOT NULL,
    fecha_inicio DATE,
    fecha_vencimiento DATE,
    estado VARCHAR(50) DEFAULT 'Vigente',
    archivo_id INT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL,
    FOREIGN KEY (consorcio_id) REFERENCES consorcios(id) ON DELETE SET NULL,
    FOREIGN KEY (archivo_id) REFERENCES archivos(id) ON DELETE SET NULL
);

-- 6. Facturas
CREATE TABLE IF NOT EXISTS facturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(100) NOT NULL,
    empresa_id INT,
    monto DECIMAL(15, 2) NOT NULL,
    fecha_salida DATE,
    tipo_fianza VARCHAR(100),
    numero_fianza VARCHAR(100),
    observada BOOLEAN DEFAULT FALSE,
    detalle_observacion TEXT,
    archivo_id INT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL,
    FOREIGN KEY (archivo_id) REFERENCES archivos(id) ON DELETE SET NULL
);

-- 7. Cargos
CREATE TABLE IF NOT EXISTS cargos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL,
    tipo VARCHAR(100) NOT NULL, -- ej: 'Pagaré', 'Cheque', 'Liberación'
    descripcion TEXT,
    destinatario VARCHAR(150),
    remitente VARCHAR(150),
    asunto TEXT,
    fecha_registro_cargo DATE,
    usuario_registro VARCHAR(100),
    archivo_id INT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (archivo_id) REFERENCES archivos(id) ON DELETE SET NULL
);

-- INSERCIÓN DE DATOS DE PRUEBA
INSERT INTO empresas (nombre, ruc) VALUES 
('Cesce', '20123456789'),
('Constructora A', '20987654321');

INSERT INTO consorcios (nombre, empresa_id) VALUES 
('Consorcio Vial 1', 1),
('Consorcio Puente Sur', 1);
