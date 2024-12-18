// módulos necesarios
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

// Configuración inicial del servidor
const app = express();
const PORT = 8080;

// Middleware de JSON
app.use(express.json());

// Directorios para archivos de persistencia
const productsFilePath = path.join(__dirname, 'productos.json');
const cartsFilePath = path.join(__dirname, 'carrito.json');

// Funciones reutilizables para manejo de archivos
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

// Verificacion de archivos, si no existen, crearlos vacíos
const initializeFiles = async () => {
    try {
        await fs.access(productsFilePath).catch(() => writeFileData(productsFilePath, []));
        await fs.access(cartsFilePath).catch(() => writeFileData(cartsFilePath, []));
        console.log('Archivos inicializados correctamente.');
    } catch (error) {
        console.error('Error al inicializar los archivos:', error);
    }
};

// función para inicializar los archivos
initializeFiles();

//  rutas para /api/products
const productsRouter = express.Router();

// GET /api/products - todos los productos
productsRouter.get('/', async (req, res) => {
    try {
        const products = await readFileData(productsFilePath);
        const limit = parseInt(req.query.limit);
        if (!isNaN(limit)) {
            return res.json(products.slice(0, limit));
        }
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'No se pudieron cargar los productos. Intenta de nuevo.' });
    }
});

// GET /api/products/:pid - producto por ID
productsRouter.get('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const products = await readFileData(productsFilePath);
        const product = products.find(p => p.id === pid);
        if (!product) {
            return res.status(404).json({ error: `El producto con ID ${pid} no existe.` });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Error al buscar el producto. Revisa el ID e inténtalo nuevamente.' });
    }
});

// POST /api/products - Crear nuevo producto
productsRouter.post('/', async (req, res) => {
    try {
        const { title, description, code, price, status = true, stock, category, thumbnails = [] } = req.body;
        if (!title || !description || !code || !price || stock === undefined || !category) {
            return res.status(400).json({ error: 'Faltan campos obligatorios (excepto thumbnails).' });
        }
        const products = await readFileData(productsFilePath);
        const newProduct = {
            id: Date.now().toString(), // Generando ID único basado en timestamp
            title,
            description,
            code,
            price,
            status,
            stock,
            category,
            thumbnails
        };
        products.push(newProduct);
        await writeFileData(productsFilePath, products);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ error: 'No se pudo crear el producto. Intenta más tarde.' });
    }
});

// PUT /api/products/:pid - Actualizar producto
productsRouter.put('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const updates = req.body;
        const products = await readFileData(productsFilePath);
        const productIndex = products.findIndex(p => p.id === pid);
        if (productIndex === -1) {
            return res.status(404).json({ error: `Producto con ID ${pid} no encontrado.` });
        }
        const updatedProduct = { ...products[productIndex], ...updates, id: pid };
        products[productIndex] = updatedProduct;
        await writeFileData(productsFilePath, products);
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el producto. Intenta nuevamente.' });
    }
});

// DELETE /api/products/:pid - Eliminando un producto
productsRouter.delete('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const products = await readFileData(productsFilePath);
        const updatedProducts = products.filter(p => p.id !== pid);
        if (products.length === updatedProducts.length) {
            return res.status(404).json({ error: `No se encontró el producto con ID ${pid}.` });
        }
        await writeFileData(productsFilePath, updatedProducts);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'No se pudo eliminar el producto. Intenta de nuevo.' });
    }
});

// Configuración de rutas para /api/carts
const cartsRouter = express.Router();

// POST /api/carts - Crear un nuevo carrito
cartsRouter.post('/', async (req, res) => {
    try {
        const carts = await readFileData(cartsFilePath);
        const newCart = {
            id: Date.now().toString(), // Generar un ID único basado en timestamp
            products: []
        };
        carts.push(newCart);
        await writeFileData(cartsFilePath, carts);
        res.status(201).json(newCart);
    } catch (error) {
        res.status(500).json({ error: 'No se pudo crear el carrito. Intenta más tarde.' });
    }
});

// GET /api/carts/:cid - Obtener productos de un carrito por ID
cartsRouter.get('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const carts = await readFileData(cartsFilePath);
        const cart = carts.find(c => c.id === cid);
        if (!cart) {
            return res.status(404).json({ error: `El carrito con ID ${cid} no existe.` });
        }
        res.json(cart.products);
    } catch (error) {
        res.status(500).json({ error: 'Error al buscar el carrito. Revisa el ID e inténtalo nuevamente.' });
    }
});

// POST /api/carts/:cid/product/:pid - Agregar producto a un carrito
cartsRouter.post('/:cid/product/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const carts = await readFileData(cartsFilePath);
        const products = await readFileData(productsFilePath);
        const cart = carts.find(c => c.id === cid);
        if (!cart) {
            return res.status(404).json({ error: `El carrito con ID ${cid} no existe.` });
        }
        const productExists = products.some(p => p.id === pid);
        if (!productExists) {
            return res.status(404).json({ error: `El producto con ID ${pid} no existe.` });
        }
        const productInCart = cart.products.find(p => p.product === pid);
        if (productInCart) {
            productInCart.quantity += 1;
        } else {
            cart.products.push({ product: pid, quantity: 1 });
        }
        await writeFileData(cartsFilePath, carts);
        res.status(201).json(cart);
    } catch (error) {
        res.status(500).json({ error: 'No se pudo agregar el producto al carrito. Intenta nuevamente.' });
    }
});

// Router de carritos
app.use('/api/carts', cartsRouter);

// Servidor en el puerto definido 
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
