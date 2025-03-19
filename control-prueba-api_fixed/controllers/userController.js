const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const connection = require('../db'); // ✅ Corrección: No usar `.promise()`
const twilio = require('twilio');

// Configuración de reCAPTCHA y Twilio
const RECAPTCHA_SECRET_KEY = '6LeKnNwqAAAAABQIgzfvCZI37Ikyxvdi5dMgQqnz';
const accountSid = 'AC5d5caa37b92fb17945a1215de51996e0';
const authToken = '1b5d1779658dbdc63f149c7453da3c56';
const client = new twilio(accountSid, authToken);
const twilioPhoneNumber = '+16205360032';

// Intentos de login (para evitar ataques de fuerza bruta)
const loginAttempts = {};

// 📌 **Registrar un usuario**
exports.registerUser = async (req, res) => {
    const { nombre, telefono, email, password, id_rol } = req.body;

    if (!nombre || !telefono || !email || !password || !id_rol) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        // Verificar si el rol existe
        const [roleResults] = await connection.query('SELECT * FROM tb_roles WHERE id_rol = ?', [id_rol]);
        if (roleResults.length === 0) {
            return res.status(400).json({ message: 'El rol especificado no existe' });
        }

        // Verificar si el usuario ya existe
        const [userResults] = await connection.query('SELECT * FROM tb_usuarios WHERE email = ? OR telefono = ?', [email, telefono]);
        if (userResults.length > 0) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        await connection.query('INSERT INTO tb_usuarios (nombre, telefono, email, password, id_rol) VALUES (?, ?, ?, ?, ?)',
            [nombre, telefono, email, hashedPassword, id_rol]);

        res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (err) {
        console.error('Error al registrar usuario:', err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// 📌 **Iniciar sesión**
exports.loginUser = async (req, res) => {
    const { email, password, captchaResponse } = req.body;

    try {
        // Manejo de intentos fallidos
        if (loginAttempts[email] && loginAttempts[email].attempts >= 4) {
            const timeBlocked = Date.now() - loginAttempts[email].lastAttempt;
            if (timeBlocked < 3 * 60 * 1000) { // 3 minutos bloqueado
                return res.status(403).json({ message: 'Demasiados intentos fallidos. Intenta de nuevo más tarde.' });
            } else {
                loginAttempts[email] = { attempts: 0, lastAttempt: null };
            }
        }

        // Verificar CAPTCHA si hay más de 3 intentos fallidos
        if (loginAttempts[email] && loginAttempts[email].attempts >= 3) {
            const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${captchaResponse}`;
            const response = await axios.post(verificationUrl);
            if (!response.data.success) {
                return res.status(400).json({ message: 'Verificación de reCAPTCHA fallida.' });
            }
        }

        const [users] = await connection.query('SELECT * FROM tb_usuarios WHERE email = ?', [email]);
        if (users.length === 0) {
            loginAttempts[email] = loginAttempts[email] ? { attempts: loginAttempts[email].attempts + 1, lastAttempt: Date.now() } : { attempts: 1, lastAttempt: Date.now() };
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const user = users[0];
        if (await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ id: user.id_usuario, role: user.id_rol, nombre: user.nombre }, 'tu_secreto', { expiresIn: '1h' });
            res.json({ token, role: user.id_rol });
        } else {
            loginAttempts[email] = loginAttempts[email] ? { attempts: loginAttempts[email].attempts + 1, lastAttempt: Date.now() } : { attempts: 1, lastAttempt: Date.now() };
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// 📌 **Obtener todos los usuarios**
exports.getAllUsers = async (req, res) => {
    try {
        const [results] = await connection.query('SELECT * FROM tb_usuarios');
        res.json(results);
    } catch (err) {
        console.error('Error al obtener usuarios:', err);
        res.status(500).json({ message: 'Error al obtener los usuarios' });
    }
};

// 📌 **Obtener un usuario por ID**
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const [results] = await connection.query('SELECT * FROM tb_usuarios WHERE id_usuario = ?', [id]);
        if (results.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(results[0]);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener el usuario' });
    }
};

// 📌 **Actualizar usuario**
exports.updateUser = async (req, res) => {
    try {
        const { nombre, telefono, email, id_rol } = req.body;
        const { id } = req.params;
        await connection.query('UPDATE tb_usuarios SET nombre = ?, telefono = ?, email = ?, id_rol = ? WHERE id_usuario = ?', 
            [nombre, telefono, email, id_rol, id]);
        res.json({ message: 'Usuario actualizado con éxito' });
    } catch (err) {
        res.status(500).json({ message: 'Error al actualizar el usuario' });
    }
};

// 📌 **Eliminar usuario**
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await connection.query('DELETE FROM tb_usuarios WHERE id_usuario = ?', [id]);
        res.json({ message: 'Usuario eliminado con éxito' });
    } catch (err) {
        res.status(500).json({ message: 'Error al eliminar el usuario' });
    }
};

// 📌 **Generar y enviar código de acceso por SMS**
exports.generateAccessCode = async (req, res) => {
    try {
        const userId = req.user.id_usuario;
        const { phoneNumber } = req.body;

        if (!phoneNumber) return res.status(400).json({ message: 'Proporciona un número de teléfono' });

        const code = Math.floor(10000 + Math.random() * 90000).toString();
        await connection.query('INSERT INTO tb_accesos (id_usuario, codigo, estado, fecha_expiracion) VALUES (?, ?, ?, NOW() + INTERVAL 1 DAY)',
            [userId, code, 'Activo']);

        await client.messages.create({ body: `Tu código de acceso es: ${code}`, from: twilioPhoneNumber, to: phoneNumber });

        res.status(201).json({ code, message: 'Código generado y enviado con éxito' });
    } catch (err) {
        res.status(500).json({ message: 'Error al generar el código' });
    }
};
