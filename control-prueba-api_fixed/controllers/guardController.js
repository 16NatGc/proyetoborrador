const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Obtener datos del Dashboard (Ejemplo básico)
const getDashboardData = (req, res) => {
    res.json({ message: 'Panel de Vigilante - Dashboard' });
};

// Registro de usuario
const registerUser = async (req, res) => {
    const { nombre, telefono, email, password, id_rol } = req.body;

    try {
        console.log('Datos recibidos para registro:', { nombre, telefono, email, id_rol });

        if (!nombre || !telefono || !email || !password || !id_rol) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        // Verificar si el email ya existe
        const [existingUser] = await db.query('SELECT * FROM tb_usuarios WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Contraseña hasheada:', hashedPassword);

        // Insertar el nuevo usuario
        const [result] = await db.query(
            'INSERT INTO tb_usuarios (nombre, telefono, email, password, id_rol) VALUES (?, ?, ?, ?, ?)',
            [nombre, telefono, email, hashedPassword, id_rol]
        );
        console.log('Usuario registrado con ID:', result.insertId);

        res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (err) {
        console.error('Error al registrar:', err.message, err.stack);
        res.status(500).json({ message: 'Error al registrar', error: err.message });
    }
};

// Login de usuario
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        console.log('Datos recibidos para login:', { email, password });

        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
        }

        console.log('Buscando usuario con email:', email);
        const [user] = await db.query('SELECT * FROM tb_usuarios WHERE email = ?', [email]);
        console.log('Usuario encontrado:', user);

        if (user.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        console.log('Comparando contraseñas...');
        const isMatch = await bcrypt.compare(password, user[0].password);
        console.log('Resultado de la comparación:', isMatch);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        console.log('Generando token...');
        const token = jwt.sign(
            { id_usuario: user[0].id_usuario, id_rol: user[0].id_rol },
            process.env.JWT_SECRET || 'tu_secreto',
            { expiresIn: '1h' }
        );
        console.log('Token generado:', token);

        console.log('Buscando rol con id_rol:', user[0].id_rol);
        const [role] = await db.query('SELECT nombre FROM tb_roles WHERE id_rol = ?', [user[0].id_rol]);
        console.log('Rol encontrado:', role);

        if (role.length === 0) {
            return res.status(404).json({ message: 'Rol no encontrado para este usuario' });
        }

        const roleName = role[0].nombre;
        console.log('Rol asignado:', roleName);

        res.json({ token, roleName });
    } catch (err) {
        console.error('Error al iniciar sesión:', err.message, err.stack);
        res.status(500).json({ message: 'Error al iniciar sesión', error: err.message });
    }
};

// Obtener todos los usuarios
const getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query('SELECT * FROM tb_usuarios');

        if (users.length === 0) {
            return res.status(404).json({ message: 'No hay usuarios registrados' });
        }

        res.json(users);
    } catch (err) {
        console.error('Error al obtener usuarios:', err);
        res.status(500).json({ message: 'Error al obtener usuarios', error: err.message });
    }
};

// Obtener usuario por ID
const getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const [user] = await db.query('SELECT * FROM tb_usuarios WHERE id_usuario = ?', [id]);

        if (user.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(user[0]);
    } catch (err) {
        console.error('Error al obtener usuario por ID:', err);
        res.status(500).json({ message: 'Error al obtener usuario', error: err.message });
    }
};

module.exports = { 
    getDashboardData, 
    registerUser, 
    loginUser, 
    getAllUsers, 
    getUserById 
};
