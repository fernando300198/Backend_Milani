const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();
const cartsFilePath = path.join(__dirname, '../api/carts.json');

// funciones de lectura y escritura
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

// GET /api/carts/ - obtener carrito
router.get('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const carts = await readFileData(cartsFilePath);
        const cart = carts.find(c => c.id === cid);
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener carrito.' });
    }
});

module.exports = router;