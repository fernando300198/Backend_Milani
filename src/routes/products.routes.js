const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();
const productsFilePath = path.join(__dirname, '../api/products.json'); 

// funciones para manejar archivos
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

// GET en /api/products - obbtener todos los productos
router.get('/', async (req, res) => {
    try {
        const products = await readFileData(productsFilePath);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener productos.' });
    }
});

module.exports = router;