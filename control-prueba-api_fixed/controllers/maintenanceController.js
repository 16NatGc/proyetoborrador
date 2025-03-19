const db = require('../db');
const generateAccessCode = async (req, res) => {
  const userId = req.user.id_usuario;
  const { id_auto, fecha_expiracion } = req.body;
  try {v
    // Validar que fecha_expiracion sea proporcionada
    if (!fecha_expiracion) {
      return res.status(400).json({ message: 'fecha_expiracion es obligatoria' });
    }

    // Generar un código numérico de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString(); // Genera un número entre 100000 y 999999

    // Insertar el nuevo código en tb_accesos
    const [result] = await db.query(
      'INSERT INTO tb_accesos (id_usuario, id_auto, codigo, estado, fecha_expiracion) VALUES (?, ?, ?, ?, ?)',
      [userId, id_auto || null, codigo, 'Activo', fecha_expiracion]
    );

    // Devolver el código generado y su ID
    res.json({
      message: 'Código generado con éxito',
      code: codigo,
      id: result.insertId,
      fecha_expiracion,
    });
  } catch (err) {
    console.error('Error al generar código de acceso:', err.message, err.stack);
    res.status(500).json({ message: 'Error al generar código de acceso', error: err.message });
  }
};

// Resto del controlador (sin cambios)
const getAccessHistory = async (req, res) => {
  const userId = req.user.id_usuario;
  try {
    const [results] = await db.query(
      'SELECT * FROM tb_detalle_acceso WHERE id_acceso IN (SELECT id_acceso FROM tb_accesos WHERE id_usuario = ?)',
      [userId]
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener el historial de accesos', error: err.message });
  }
};

const getCars = async (req, res) => {
  const userId = req.user.id_usuario;
  try {
    const [results] = await db.query('SELECT * FROM tb_autos WHERE id_usuario = ?', [userId]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener los autos', error: err.message });
  }
};

const addCar = async (req, res) => {
  const userId = req.user.id_usuario;
  const { placa, modelo, color } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO tb_autos (id_usuario, placa, modelo, color) VALUES (?, ?, ?, ?)',
      [userId, placa, modelo, color]
    );
    res.status(201).json({ message: 'Auto agregado con éxito', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Error al agregar el auto', error: err.message });
  }
};

const updateCar = async (req, res) => {
  const userId = req.user.id_usuario;
  const carId = req.params.id;
  const { placa, modelo, color } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE tb_autos SET placa = ?, modelo = ?, color = ? WHERE id_auto = ? AND id_usuario = ?',
      [placa, modelo, color, carId, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Auto no encontrado o no pertenece al usuario' });
    }
    res.json({ message: 'Auto actualizado con éxito' });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar el auto', error: err.message });
  }
};

const deleteCar = async (req, res) => {
  const userId = req.user.id_usuario;
  const carId = req.params.id;
  try {
    const [result] = await db.query('DELETE FROM tb_autos WHERE id_auto = ? AND id_usuario = ?', [carId, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Auto no encontrado o no pertenece al usuario' });
    }
    res.json({ message: 'Auto eliminado con éxito' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar el auto', error: err.message });
  }
};

const getSensors = async (req, res) => {
  try {
    const [sensors] = await db.query('SELECT * FROM tb_sensores');
    res.json(sensors);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener sensores', error: err.message });
  }
};

const getAccessCodes = async (req, res) => {
  const userId = req.user.id_usuario;
  try {
    const [codes] = await db.query('SELECT * FROM tb_accesos WHERE id_usuario = ?', [userId]);
    res.json(codes);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener códigos de acceso', error: err.message });
  }
};

const deleteAccessCode = async (req, res) => {
  const userId = req.user.id_usuario;
  const codeId = req.params.id;
  try {
    const [result] = await db.query('DELETE FROM tb_accesos WHERE id_acceso = ? AND id_usuario = ?', [codeId, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Código de acceso no encontrado o no pertenece al usuario' });
    }
    res.json({ message: 'Código de acceso eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar código de acceso', error: err.message });
  }
};

module.exports = {
  getAccessHistory,
  getCars,
  addCar,
  updateCar,
  deleteCar,
  getSensors,
  getAccessCodes,
  deleteAccessCode,
  generateAccessCode,
};