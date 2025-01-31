// modulos necesarios
const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const productsRouter = require('./routes/products.routes');
const cartsRouter = require('./routes/carts.routes');
const fs = require('fs').promises;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 8080;

// config de Handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// render de vistas
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/realtimeproducts', (req, res) => {
    res.render('realTimeProducts');
});

// config de websockets
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');

    socket.on('addProduct', async (newProduct) => {
        io.emit('updateProducts', newProduct);
    });

    socket.on('deleteProduct', async (productId) => {
        io.emit('updateProducts', productId);
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// Iniciar server
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// archivos de persistencia por si no existen
const initializeFiles = async () => {
    try {
        await fs.access(path.join(__dirname, 'api/products.json')).catch(() =>
            fs.writeFile(path.join(__dirname, 'api/products.json'), '[]')
        );
        await fs.access(path.join(__dirname, 'api/carts.json')).catch(() =>
            fs.writeFile(path.join(__dirname, 'api/carts.json'), '[]')
        );
        console.log('Archivos de API inicializados correctamente.');
    } catch (error) {
        console.error('Error al inicializar los archivos:', error);
    }
};

initializeFiles();