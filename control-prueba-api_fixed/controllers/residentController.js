const db = require('../db');

const generateAccessCode = async (req, res) => {
  const userId = req.user.id;
  const { id_auto, fecha_expiracion } = req.body;
  try {
    // Validar solo fecha_expiracion
    if (!fecha_expiracion) {
      return res.status(400).json({ message: 'fecha_expiracion es obligatoria' });
    }

    // Generar un código numérico de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // Insertar el nuevo código en tb_accesos, permitiendo que id_auto sea null
    const [result] = await db.query(
      'INSERT INTO tb_accesos (id_usuario, id_auto, codigo, estado, fecha_expiracion) VALUES (?, ?, ?, ?, ?)',
      [userId, id_auto || null, codigo, 'Activo', fecha_expiracion]
    );

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

const getUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query('SELECT nombre, foto FROM tb_usuarios WHERE id_usuario = ?', [userId]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } catch (err) {
    console.error('Error al obtener información del usuario:', err.message, err.stack);
    res.status(500).json({ message: 'Error al obtener información del usuario', error: err.message });
  }
};

const getUsersSameRole = async (req, res) => {
  try {
    const userRoleId = req.user.role;
    const [rows] = await db.query('SELECT id_usuario, nombre, email FROM tb_usuarios WHERE id_rol = ?', [userRoleId]);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener usuarios con el mismo rol:', err.message, err.stack);
    res.status(500).json({ message: 'Error al obtener usuarios con el mismo rol', error: err.message });
  }
};



const getAccessHistory = async (req, res) => {
  const userId = req.user.id;
  try {
    const [results] = await db.query(
      'SELECT * FROM tb_detalle_acceso WHERE id_acceso IN (SELECT id_acceso FROM tb_accesos WHERE id_usuario = ?)',
      [userId]
    );
    res.json(results);
  } catch (err) {
    console.error('Error al obtener el historial de accesos:', err.message, err.stack);
    res.status(500).json({ message: 'Error al obtener el historial de accesos', error: err.message });
  }
};

const getCars = async (req, res) => {
  const userId = req.user.id;
  try {
    const [results] = await db.query('SELECT * FROM tb_autos WHERE id_usuario = ?', [userId]);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener los autos:', err.message, err.stack);
    res.status(500).json({ message: 'Error al obtener los autos', error: err.message });
  }
};

const addCar = async (req, res) => {
  const userId = req.user.id;
  const { placa, modelo, color } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO tb_autos (id_usuario, placa, modelo, color) VALUES (?, ?, ?, ?)',
      [userId, placa, modelo, color]
    );
    res.status(201).json({ message: 'Auto agregado con éxito', id: result.insertId });
  } catch (err) {
    console.error('Error al agregar el auto:', err.message, err.stack);
    res.status(500).json({ message: 'Error al agregar el auto', error: err.message });
  }
};

const updateCar = async (req, res) => {
  const userId = req.user.id;
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
    console.error('Error al actualizar el auto:', err.message, err.stack);
    res.status(500).json({ message: 'Error al actualizar el auto', error: err.message });
  }
};

const deleteCar = async (req, res) => {
  const userId = req.user.id;
  const carId = req.params.id;
  try {
    const [result] = await db.query('DELETE FROM tb_autos WHERE id_auto = ? AND id_usuario = ?', [carId, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Auto no encontrado o no pertenece al usuario' });
    }
    res.json({ message: 'Auto eliminado con éxito' });
  } catch (err) {
    console.error('Error al eliminar el auto:', err.message, err.stack);
    res.status(500).json({ message: 'Error al eliminar el auto', error: err.message });
  }
};

const getSensors = async (req, res) => {
  try {
    const [sensors] = await db.query('SELECT * FROM tb_sensores');
    res.json(sensors);
  } catch (err) {
    console.error('Error al obtener sensores:', err.message, err.stack);
    res.status(500).json({ message: 'Error al obtener sensores', error: err.message });
  }
};

const getAccessCodes = async (req, res) => {
  const userId = req.user.id;
  try {
    const [codes] = await db.query('SELECT * FROM tb_accesos WHERE id_usuario = ?', [userId]);
    res.json(codes);
  } catch (err) {
    console.error('Error al obtener códigos de acceso', err.message, err.stack);
    res.status(500).json({ message: 'Error al obtener códigos de acceso', error: err.message });
  }
};

const deleteAccessCode = async (req, res) => {
  const userId = req.user.id;
  const codeId = req.params.id;
  try {
    const [result] = await db.query('DELETE FROM tb_accesos WHERE id_acceso = ? AND id_usuario = ?', [codeId, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Código de acceso no encontrado o no pertenece al usuario' });
    }
    res.json({ message: 'Código de acceso eliminado' });
  } catch (err) {
    console.error('Error al eliminar código de acceso', err.message, err.stack);
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
  getUserInfo,
  getUsersSameRole
};
