// modules necesarios
const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const fs = require('fs').promises;
const { Server } = require('socket.io');
const http = require('http');

// config inicial del server
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 8080;

// midleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// config de Handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Directorios archivos de persistencia
const productsFilePath = path.join(__dirname, 'productos.json');

// Funciones para manejo de archivos
const readFileData = async (filePath) => {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
};

const writeFileData = async (filePath, data) => {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

// Inicializar archivo de productos si no existe
const initializeFiles = async () => {
    try {
        await fs.access(productsFilePath).catch(() => writeFileData(productsFilePath, []));
        console.log('Archivo de productos inicializado correctamente.');
    } catch (error) {
        console.error('Error al inicializar el archivo:', error);
    }
};
initializeFiles();

// ruta de vistas
app.get('/', async (req, res) => {
    const products = await readFileData(productsFilePath);
    res.render('home', { products });
});

app.get('/realtimeproducts', async (req, res) => {
    const products = await readFileData(productsFilePath);
    res.render('realTimeProducts', { products });
});

// config de Socket.IO
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');

    // Agregar un producto
    socket.on('addProduct', async (newProduct) => {
        const products = await readFileData(productsFilePath);
        newProduct.id = Date.now().toString(); // Generar un ID único
        products.push(newProduct);
        await writeFileData(productsFilePath, products);
        io.emit('updateProducts', products); // Enviar productos actualizados
    });

    // Eliminar un producto
    socket.on('deleteProduct', async (productId) => {
        let products = await readFileData(productsFilePath);
        products = products.filter((product) => product.id !== productId);
        await writeFileData(productsFilePath, products);
        io.emit('updateProducts', products); // Enviar productos actualizados
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// Iniciar servidor
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
