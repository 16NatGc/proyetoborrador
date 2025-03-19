const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const guardRoutes = require('./routes/guardRoutes');
const residentRoutes = require('./routes/residentRoutes');
const visitorRoutes = require('./routes/visitorRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Configurar CORS
app.use(cors());

// Middleware para parsear JSON
app.use(express.json());

// Middleware para depuración
app.use((req, res, next) => {
  console.log('Cuerpo de la solicitud recibido:', req.body);
  next();
});

// Montar rutas
app.use('/api/auth', authRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/guard', guardRoutes);
app.use('/api/resident', residentRoutes);
app.use('/api/visitor', visitorRoutes);
app.use('/api/user', userRoutes);

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});