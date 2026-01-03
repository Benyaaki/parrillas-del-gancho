const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;
const STATS_FILE = path.join(__dirname, 'stats.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files from root

// Initialize stats if not exists
if (!fs.existsSync(STATS_FILE)) {
    const initialStats = {
        visits: 0,
        quotes: 0,
        contact_attempts: 0,
        social_clicks: 0
    };
    fs.writeFileSync(STATS_FILE, JSON.stringify(initialStats, null, 2));
}

// Helper: Read Stats
function getStats() {
    try {
        return JSON.parse(fs.readFileSync(STATS_FILE));
    } catch (e) {
        return { visits: 0, quotes: 0, contact_attempts: 0, social_clicks: 0 };
    }
}

// Helper: Save Stats
function saveStats(stats) {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
}

// Endpoint: Track Event
// Endpoint: Track Event
app.post('/api/track', (req, res) => {
    const { type, productName } = req.body;
    const stats = getStats();
    const today = new Date().toISOString().split('T')[0];

    // Ensure structures exist
    if (!stats.products) stats.products = {};
    if (!stats.history) stats.history = {};
    if (!stats.history[today]) stats.history[today] = { visits: 0, quotes: 0, contact_attempts: 0, social_clicks: 0, products: {} };

    // Global + Daily Validation
    const daily = stats.history[today];

    if (type === 'visit') { stats.visits++; daily.visits++; }
    else if (type === 'quote') {
        stats.quotes++; daily.quotes++;
        if (productName) {
            // Global
            if (!stats.products[productName]) stats.products[productName] = 0;
            stats.products[productName]++;
            // Daily
            if (!daily.products) daily.products = {};
            if (!daily.products[productName]) daily.products[productName] = 0;
            daily.products[productName]++;
        }
    }
    else if (type === 'contact') { stats.contact_attempts++; daily.contact_attempts++; }
    else if (type === 'social') { stats.social_clicks++; daily.social_clicks++; }

    saveStats(stats);
    res.json({ success: true, stats });
});

// Endpoint: Sales Administration
app.get('/api/sales', (req, res) => {
    const stats = getStats();
    res.json(stats.sales || []);
});

app.post('/api/sales', (req, res) => {
    const { date, product, amount, notes } = req.body;
    const stats = getStats();

    if (!stats.sales) stats.sales = [];

    // Auto-generate ID (simple)
    const id = Date.now().toString();
    const sale = { id, date, product, amount, notes, createdAt: new Date().toISOString() };

    stats.sales.push(sale);
    saveStats(stats);

    res.json({ success: true, sale });
});

app.delete('/api/sales/:id', (req, res) => {
    const { id } = req.params;
    const stats = getStats();

    if (stats.sales) {
        stats.sales = stats.sales.filter(s => s.id !== id);
        saveStats(stats);
    }
    res.json({ success: true });
});

app.put('/api/sales/:id', (req, res) => {
    const { id } = req.params;
    const { date, product, amount } = req.body;
    const stats = getStats();

    if (stats.sales) {
        const index = stats.sales.findIndex(s => s.id === id);
        if (index !== -1) {
            stats.sales[index] = { ...stats.sales[index], date, product, amount };
            saveStats(stats);
            return res.json({ success: true });
        }
    }
    res.status(404).json({ success: false, message: 'Venta no encontrada' });
});

const CONFIG_FILE = path.join(__dirname, 'config.json');

// Initialize config if not exists
if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ password: "admin123" }, null, 2));
}

// Helper: Read Config
function getConfig() {
    try {
        return JSON.parse(fs.readFileSync(CONFIG_FILE));
    } catch (e) {
        return { password: "admin123" };
    }
}

// Helper: Save Config
function saveConfig(config) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Endpoint: Login
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const config = getConfig();
    if (password === config.password) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

// Endpoint: Change Password
app.post('/api/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const config = getConfig();

    if (currentPassword === config.password) {
        config.password = newPassword;
        saveConfig(config);
        res.json({ success: true, message: 'Password updated successfully' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid current password' });
    }
});

// Endpoint: Send Email
app.post('/api/send-email', async (req, res) => {
    const { nombre, email, mensaje } = req.body;
    const config = getConfig();

    if (!config.emailUser || !config.emailPass) {
        return res.status(500).json({ success: false, message: 'Server email not configured.' });
    }

    if (mensaje && mensaje.length > 300) {
        return res.status(400).json({ success: false, message: 'El mensaje no puede exceder los 300 caracteres.' });
    }


    // --- Rate Limiting Logic ---
    const stats = getStats();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (!stats.email_usage || stats.email_usage.date !== today) {
        stats.email_usage = { date: today, count: 0 };
    }

    if (stats.email_usage.count >= 50) {
        return res.status(429).json({ success: false, message: 'Límite diario de correos alcanzado (50).' });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: config.emailUser,
                pass: config.emailPass
            }
        });


        // Plantilla HTML
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Roboto:wght@400;700&display=swap');
                    
                    body { 
                        font-family: 'Roboto', Helvetica, Arial, sans-serif; 
                        background-color: #121212; 
                        margin: 0; 
                        padding: 0; 
                        color: #ffffff; 
                    }
                    .container { 
                        width: 100%; 
                        max-width: 600px; 
                        margin: 0 auto; 
                        background-color: #1e1e1e; 
                        border: 1px solid #333; 
                    }
                    .header { 
                        background-color: #000000; 
                        padding: 50px 20px; 
                        text-align: center; 
                        border-bottom: 3px solid #d7261e; 
                    }
                    .header img { 
                        max-width: 100px; /* Logo más pequeño */
                        height: auto; 
                    }
                    .content { 
                        padding: 60px 40px; /* Mayor espaciado */
                        text-align: left; 
                    }
                    .title { 
                        color: #f46b1b; 
                        font-family: 'Oswald', sans-serif;
                        font-size: 26px; 
                        font-weight: 700; 
                        margin-bottom: 30px; 
                        text-transform: uppercase; 
                        letter-spacing: 1px;
                        text-align: center;
                    }
                    .intro-text {
                        color: #cccccc;
                        font-size: 15px;
                        line-height: 1.6;
                        margin-bottom: 40px;
                        text-align: center;
                    }
                    .field-label { 
                        color: #888888; 
                        font-size: 12px; 
                        text-transform: uppercase; 
                        font-weight: bold; 
                        margin-top: 25px; 
                        display: block; 
                        letter-spacing: 1.5px;
                    }
                    .field-value { 
                        color: #ffffff; 
                        font-size: 18px; 
                        margin-bottom: 15px; 
                        border-left: 2px solid #d7261e; 
                        padding-left: 15px; 
                        font-weight: 500;
                    }
                    .message-box { 
                        background-color: #252525; 
                        padding: 25px; 
                        border-radius: 8px; 
                        border: 1px solid #333; 
                        margin-top: 15px; 
                        font-style: italic; 
                        color: #dddddd; 
                        line-height: 1.6;
                    }
                    /* Estilos Footer */
                    .footer-title {
                        font-family: 'Oswald', sans-serif;
                        font-size: 32px; /* Más grande */
                        font-weight: 700;
                        text-transform: uppercase;
                        margin: 0;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.9);
                        letter-spacing: 2px;
                        color: #ffffff;
                    }
                    .footer-subtitle {
                        font-family: 'Roboto', sans-serif;
                        font-size: 14px;
                        text-transform: uppercase;
                        opacity: 0.9;
                        margin-top: 10px;
                        letter-spacing: 4px;
                        color: #ffc300;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="cid:logo_letras" alt="Parrillas del Gancho">
                    </div>
                    
                    <div class="content">
                        <div class="title">Nuevo Mensaje Recibido</div>
                        <p class="intro-text">Has recibido una nueva solicitud de contacto desde tu sitio web.</p>
                        
                        <span class="field-label">Nombre del Cliente</span>
                        <div class="field-value">${nombre}</div>
                        
                        <span class="field-label">Correo Electrónico</span>
                        <div class="field-value">${email}</div>
                        
                        <span class="field-label">Mensaje</span>
                        <div class="message-box">
                            "${mensaje}"
                        </div>
                    </div>

                    <!-- Footer -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td align="center" valign="middle" background="cid:footer_bg" style="
                                background-image: url('cid:footer_bg');
                                background-size: cover;
                                background-position: center;
                                background-repeat: no-repeat;
                                padding: 80px 20px;
                                color: #ffffff;
                            ">
                                <!-- Fallback background color if image fails -->
                                <div style="position: relative; z-index: 2;">
                                    <p class="footer-title">
                                        Parrillas del Gancho
                                    </p>
                                    <p class="footer-subtitle">
                                        Administración Web
                                    </p>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"Web Parrillas" <${config.emailUser}>`,
            to: config.emailUser,
            replyTo: email, // Reply directly to the client
            subject: `🔥 Nuevo Contacto: ${nombre}`,
            html: htmlContent,
            attachments: [
                {
                    filename: 'logo_letras.png',
                    path: path.join(__dirname, 'img', 'logo_letras.png'),
                    cid: 'logo_letras'
                },
                {
                    filename: 'fondohero.png',
                    path: path.join(__dirname, 'img', 'fondohero.png'),
                    cid: 'footer_bg'
                }
            ]
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ success: false, message: 'Error sending email' });
            }
            console.log('Email sent: ' + info.response);

            // Increment Stats Only on Success
            stats.email_usage.count += 1;
            stats.contact_attempts += 1;
            if (stats.history[today]) {
                stats.history[today].contact_attempts = (stats.history[today].contact_attempts || 0) + 1;
            }
            saveStats(stats);

            res.json({ success: true, message: 'Email sent successfully' });
        });

    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ success: false, message: 'Error sending email' });
    }
});

// Endpoint: Get Stats
app.get('/api/stats', (req, res) => {
    const stats = getStats();
    // Ensure structure for frontend safety
    if (!stats.products) stats.products = {};
    res.json(stats);
});

// --- Product Management (Replaces Hardcoded Data) ---

const multer = require('multer');

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'img/'); // Save to img/ folder
    },
    filename: function (req, file, cb) {
        // Safe filename: timestamp-original.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const PRODUCTS_FILE = path.join(__dirname, 'products.json');

// Helper: Read Products
function getProducts() {
    try {
        if (!fs.existsSync(PRODUCTS_FILE)) return [];
        return JSON.parse(fs.readFileSync(PRODUCTS_FILE));
    } catch (e) {
        return [];
    }
}

// Helper: Save Products
function saveProducts(products) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

// API: Get All Products
app.get('/api/products', (req, res) => {
    res.json(getProducts());
});

// API: Add Product
app.post('/api/products', upload.single('image'), (req, res) => {
    try {
        const { name, type, price, description, badge } = req.body;
        const products = getProducts();

        // Unique Badge Logic
        if (badge === 'Más vendido') {
            products.forEach(p => {
                if (p.badge === 'Más vendido') p.badge = '';
            });
        }

        const newProduct = {
            id: Date.now().toString(),
            name,
            type, // 'parrilla' or 'articulo'
            price: price || 'Consultar',
            description,
            badge: badge || '', // 'Nuevo', 'Más vendido', etc.
            image: req.file ? 'img/' + req.file.filename : 'img/default.jpg' // Save relative path
        };

        products.push(newProduct);
        saveProducts(products);

        res.json({ success: true, product: newProduct });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Error saving product' });
    }
});

// API: Update Product
app.put('/api/products/:id', upload.single('image'), (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, price, description, badge } = req.body;
        const products = getProducts();

        const index = products.findIndex(p => p.id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        // Unique Badge Logic
        if (badge === 'Más vendido') {
            products.forEach(p => {
                if (p.id !== id && p.badge === 'Más vendido') p.badge = '';
            });
        }

        // Update fields
        products[index].name = name;
        products[index].type = type;
        products[index].price = price;
        products[index].description = description;
        products[index].badge = badge || '';

        // Update image only if new one uploaded
        if (req.file) {
            products[index].image = 'img/' + req.file.filename;
        }

        saveProducts(products);

        res.json({ success: true, product: products[index] });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Error updating product' });
    }
});

// API: Delete Product
app.delete('/api/products/:id', (req, res) => {
    try {
        const { id } = req.params;
        let products = getProducts();

        // Find product to get image path (to delete file)
        const productIndex = products.findIndex(p => p.id === id);
        if (productIndex === -1) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const product = products[productIndex];

        // Optional: Delete image file if it exists and isn't a default/placeholder
        // We skip this for now to avoid deleting shared images, but can be added later.

        products.splice(productIndex, 1);
        saveProducts(products);

        res.json({ success: true, message: 'Product deleted' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Error deleting product' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
