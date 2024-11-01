const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const morgan = require('morgan');
const fs = require('fs');
// Создание приложения
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
const cookieParser = require('cookie-parser');
app.use(cookieParser());
require('dotenv').config();


const db = new sqlite3.Database('./shop.db', (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Подключение к базе данных SQLite успешно');


        const createProductTableSql = `
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            price REAL NOT NULL,
            quantity INTEGER NOT NULL,
            discount REAL DEFAULT 0,
            category TEXT NOT NULL,
            main_image TEXT,
            gallery_images TEXT,
            is_new INTEGER DEFAULT 0,
            is_bestseller INTEGER DEFAULT 0
        );
        `;
        
        db.run(createProductTableSql, (err) => {
            if (err) {
                console.error('Ошибка создания таблицы товаров:', err.message);
            } else {
                console.log('Таблица products успешно создана или уже существует');
            }
        });


        const createPromoTableSql = `
        CREATE TABLE IF NOT EXISTS promocodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL UNIQUE,
            discount REAL NOT NULL
        );
        `;
        db.run(createPromoTableSql, (err) => {
            if (err) {
                console.error('Ошибка создания таблицы промокодов:', err.message);
            } else {
                console.log('Таблица promocodes успешно создана или уже существует');
            }
        });


        const createCartTableSql = `
        CREATE TABLE IF NOT EXISTS cart (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            user_id INTEGER,
            FOREIGN KEY (product_id) REFERENCES products (id)
        );
        `;
        db.run(createCartTableSql, (err) => {
            if (err) {
                console.error('Ошибка создания таблицы корзины:', err.message);
            } else {
                console.log('Таблица cart успешно создана или уже существует');
            }
        });
    }
});

const crypto = require('crypto');

app.use((req, res, next) => {

    let userId = req.cookies.userId;

    if (!userId) {
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];

        userId = crypto.createHash('sha256').update(ip + userAgent).digest('hex');

        console.log(`Создан новый userId: ${userId}`);
        console.log(`IP: ${ip}`);
        console.log(`User-Agent: ${userAgent}`);
        

        res.cookie('userId', userId, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
    }
    

    req.userId = userId;
    next();
});



app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});





const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});


const upload = multer({ storage: storage });


const uploadMultiple = upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'galleryImages' }
]);


app.get('/api/products', (req, res) => {
    const category = req.query.category || '';
    let sql = 'SELECT * FROM products';
    const params = [];

    if (category) {
        sql += ' WHERE category = ?';
        params.push(category);
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});


app.get('/api/products/:id', (req, res) => {
    const productId = req.params.id;
    const sql = 'SELECT * FROM products WHERE id = ?';
    db.get(sql, [productId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(row);
    });
});


app.post('/api/products', uploadMultiple, (req, res) => {
    const { name, description, price, quantity, discount, category, isNew, isBestseller } = req.body;
    const mainImage = req.files['mainImage'] ? `/images/${req.files['mainImage'][0].filename}` : '';


    const galleryImages = req.files['galleryImages'] 
        ? req.files['galleryImages'].map(file => `/images/${file.filename}`).join(',')
        : '';


    const sql = 'INSERT INTO products (name, description, price, quantity, discount, category, main_image, gallery_images, is_new, is_bestseller) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const params = [name, description, price, quantity, discount, category, mainImage, galleryImages, isNew, isBestseller];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({ id: this.lastID });
    });
});




app.use('/images', express.static('images'));


app.get('/api/promocodes/:code', (req, res) => {
    const promoCode = req.params.code;
    const sql = 'SELECT * FROM promocodes WHERE code = ?';
    db.get(sql, [promoCode], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            res.json({ valid: true, discount: row.discount });
        } else {
            res.json({ valid: false });
        }
    });
});


app.post('/api/promocodes', (req, res) => {
    const { code, discount } = req.body;
    const sql = 'INSERT INTO promocodes (code, discount) VALUES (?, ?)';
    db.run(sql, [code, discount], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({ id: this.lastID, message: 'Промокод добавлен успешно' });
    });
});


app.delete('/api/promocodes/:code', (req, res) => {
    const promoCode = req.params.code;
    const sql = 'DELETE FROM promocodes WHERE code = ?';
    db.run(sql, [promoCode], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Промокод не найден' });
        } else {
            res.json({ message: 'Промокод удален успешно' });
        }
    });
});


app.get('/api/promocodes', (req, res) => {
    const sql = 'SELECT * FROM promocodes';
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});


app.post('/api/cart', (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Необходимо авторизоваться' });
    }

    const sql = 'INSERT INTO cart (product_id, quantity, user_id) VALUES (?, ?, ?)';
    const params = [productId, quantity, userId];

    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID });
    });
});

app.get('/api/cart', (req, res) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Необходимо авторизоваться' });
    }

    const sql = `SELECT products.*, cart.quantity, products.quantity AS available_quantity FROM cart
                 JOIN products ON cart.product_id = products.id
                 WHERE cart.user_id = ?`;
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});



app.post('/api/cart/deletetovar', (req, res) => {
    const { productId } = req.body;
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Необходимо авторизоваться' });
    }

    const sql = 'DELETE FROM cart WHERE product_id = ? AND user_id = ?';
    db.run(sql, [productId, userId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Товар не найден в корзине' });
        }
        res.json({ message: 'Товар успешно удален из корзины' });
    });
});



app.put('/api/products/:id', (req, res) => {
    const { name, description, price, quantity, discount, category, isBestseller, isNew } = req.body;


    const productId = req.params.id;
    const priceNum = parseFloat(price);
    const quantityNum = parseInt(quantity);
    const discountNum = discount ? parseFloat(discount) : 0;
    const is_bestseller = isBestseller ? 1 : 0;
    const is_new = isNew ? 1 : 0;
    const sql = `
    UPDATE products
    SET name = ?, description = ?, price = ?, quantity = ?, discount = ?, category = ?, main_image = ?, gallery_images = ?, is_new = ?, is_bestseller = ?
    WHERE id = ?
`;
const params = [name, description, priceNum, quantityNum, discountNum, category, mainImage, galleryImages, isNew ? 1 : 0, isBestseller ? 1 : 0, productId];

    

    db.run(sql, params, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, message: 'Товар успешно ррррр обновлен' });
    });
});

app.post('/api/cart/clear', (req, res) => {
    const userId = req.userId;
    console.log('userId:', userId);
    
    if (!userId) {
        return res.status(401).json({ error: 'Необходимо авторизоваться' });
    }
    
    const sql = 'DELETE FROM cart WHERE user_id = ?';
    db.run(sql, [userId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Корзина очищена' });
    });
});


const TELEGRAM_BOT_TOKEN = '7536714854:AAEKDCF-0Qpb5pZP_5qXquu_dBdXe72OID4';
const TELEGRAM_CHAT_ID = '-1002499195223';

app.post('/api/order', (req, res) => {
    const { phoneNumber, contactInfo, comment, cartItems, finalPrice } = req.body;


    let message = `📦 Новый заказ!\n\n📱 Номер телефона: ${phoneNumber}\n`;
    if (contactInfo) {
        message += `📧 Контакт: ${contactInfo}\n`;
    }
    if (comment) {
        message += `💬 Комментарий: ${comment}\n`;
    }
    message += `🛒 Товары:\n`;

    cartItems.forEach(item => {
        message += `• ${item.name} (x${item.quantity}) - ${item.price.toFixed(2)} ₽\n`;
    });

    message += `\n💰 Итого: ${finalPrice.toFixed(2)} ₽`;


    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    axios.post(telegramUrl, {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
    })
    .then(response => {
        console.log('Сообщение успешно отправлено в Telegram');


        cartItems.forEach(item => {
            const sql = 'UPDATE products SET quantity = quantity - ? WHERE id = ?';
            const params = [item.quantity, item.id];

            db.run(sql, params, function (err) {
                if (err) {
                    console.error('Ошибка при обновлении количества товара:', err.message);
                    return res.status(500).json({ success: false, message: 'Ошибка при обновлении количества товара' });
                }
            });
        });

        res.json({ success: true, message: 'Заказ оформлен и отправлен менеджеру через Telegram' });

    })
    .catch(error => {
        console.error('Ошибка при отправке сообщения в Telegram:', error.message);
        res.status(500).json({ success: false, message: 'Ошибка при отправке сообщения в Telegram' });
    });
});


app.delete('/api/products/:id', (req, res) => {
    const productId = req.params.id;

    const sql = 'DELETE FROM products WHERE id = ?';
    db.run(sql, [productId], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(200).json({ success: true, message: 'Товар успешно удален' });
    });
});

app.put('/api/products/edit', async (req, res) => {
    const products = req.body.products;

    if (!products || !products.length) {
        return res.status(400).json({ error: 'Массив товаров обязателен для редактирования' });
    }

    try {

        for (const item of products) {
            const { id, name, description, price, quantity, discount, category, isNew, isBestseller } = item;

            if (!id || !name || !description || !price || quantity === undefined || !category) {
                return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены для каждого товара' });
            }

            const is_bestseller = (isBestseller === 1 || isBestseller === '1') ? 1 : 0;
            const is_new = (isNew === 1 || isNew === '1') ? 1 : 0;

            const sql = `
                UPDATE products
                SET name = ?, description = ?, price = ?, quantity = ?, discount = ?, category = ?, is_new = ?, is_bestseller = ?
                WHERE id = ?
            `;
            const params = [name, description, price, quantity, discount || 0, category, is_new, is_bestseller, id];


            await new Promise((resolve, reject) => {
                db.run(sql, params, function (err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            });
        }

        res.json({ success: true, message: 'Товары успешно обновлены' });
    } catch (err) {
        console.error('Ошибка при обновлении товара:', err.message);
        res.status(500).json({ success: false, message: 'Ошибка при обновлении товара' });
    }
});





app.get('/', (req, res) => {
    res.send('Hello World!');
});








app.put('/api/editprod/:id', uploadMultiple, (req, res) => {
    const { name, description, price, quantity, discount, category, oldMainImage, oldGalleryImages, deleteMainImage, deleteGalleryImages, isBestseller, isNew } = req.body;

    const productId = req.params.id;
    const priceNum = parseFloat(price);
    const quantityNum = parseInt(quantity);
    const discountNum = discount ? parseFloat(discount) : 0;
    const is_bestseller = (isBestseller === 1 || isBestseller === '1') ? 1 : 0;
    const is_new = (isNew === 1 || isNew === '1') ? 1 : 0;

let mainImage = req.files['mainImage']
    ? `/images/${req.files['mainImage'][0].filename}`
    : oldMainImage.startsWith('/images/') ? oldMainImage : `/images/${path.basename(oldMainImage)}`;

if (deleteMainImage === 'true') {
    mainImage = null; 
}


let galleryImages = req.files['galleryImages']
    ? req.files['galleryImages'].map(file => `/images/${file.filename}`).join(',')
    : oldGalleryImages ? oldGalleryImages.split(',').map(img => img.startsWith('/images/') ? img : `/images/${path.basename(img)}`).join(',') : '';


if (deleteGalleryImages && oldGalleryImages) {
    const imagesToDelete = deleteGalleryImages.split(',');
    galleryImages = galleryImages
        ? galleryImages.split(',').filter(image => !imagesToDelete.includes(image)).join(',')
        : oldGalleryImages.split(',').filter(image => !imagesToDelete.includes(image)).join(',');
}


if (oldGalleryImages && req.files['galleryImages']) {
    galleryImages = oldGalleryImages.split(',').concat(req.files['galleryImages'].map(file => `/images/${file.filename}`)).join(',');
}


    const sql = `
        UPDATE products
        SET name = ?, description = ?, price = ?, quantity = ?, discount = ?, category = ?, main_image = ?, gallery_images = ?, is_new = ?, is_bestseller = ?
        WHERE id = ?
    `;
    const params = [name, description, priceNum, quantityNum, discountNum, category, mainImage, galleryImages, is_new, is_bestseller, productId];


    db.run(sql, params, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, message: 'Товар успешно обновлен' });
    });
});





app.put('/api/cart', (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Необходимо авторизоваться' });
    }

    if (!productId || typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ error: 'Некорректные данные для обновления' });
    }


    const selectSql = 'SELECT * FROM cart WHERE product_id = ? AND user_id = ?';
    db.get(selectSql, [productId, userId], (err, row) => {
        if (err) {
            console.error('Ошибка при выборке из корзины:', err.message);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Товар не найден в корзине' });
        }


        const checkSql = 'SELECT quantity FROM products WHERE id = ?';
        db.get(checkSql, [productId], (err, product) => {
            if (err) {
                console.error('Ошибка при проверке товара:', err.message);
                return res.status(500).json({ error: 'Ошибка сервера' });
            }

            if (!product) {
                return res.status(404).json({ error: 'Товар не найден' });
            }

            if (quantity > product.quantity) {
                return res.status(400).json({ error: `Доступно только ${product.quantity} шт.` });
            }


            const updateSql = 'UPDATE cart SET quantity = ? WHERE product_id = ? AND user_id = ?';
            db.run(updateSql, [quantity, productId, userId], function(err) {
                if (err) {
                    console.error('Ошибка при обновлении корзины:', err.message);
                    return res.status(500).json({ error: 'Ошибка сервера' });
                }

                return res.json({ success: true, message: 'Количество товара обновлено' });
            });
        });
    });
});


app.post('/api/contact', async (req, res) => {
    const { name, phone, social, message } = req.body;


    if (!phone || phone.trim() === '') {
        return res.status(400).json({ status: 'error', message: 'Номер телефона обязателен.' });
    }


    const phonePattern = /^\+?\d{7,15}$/;
    if (!phonePattern.test(phone)) {
        return res.status(400).json({ status: 'error', message: 'Номер телефона некорректен.' });
    }


    let text = `<b>Новое сообщение с сайта БронеТек</b>\n`;
    text += `<b>Имя:</b> ${name || 'Не указано'}\n`;
    text += `<b>Номер телефона:</b> ${phone}\n`;
    text += `<b>Контакт в Telegram/VK:</b> ${social || 'Не указано'}\n`;
    text += `<b>Сообщение:</b>\n${message}`;


    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    try {

        const telegramResponse = await axios.post(telegramApiUrl, {
            chat_id: TELEGRAM_CHAT_ID,
            parse_mode: 'HTML',
            text: text
        });

        if (telegramResponse.data.ok) {
            return res.status(200).json({ status: 'success', message: 'Ваше сообщение успешно отправлено!' });
        } else {
            console.error('Ошибка Telegram API:', telegramResponse.data);
            return res.status(500).json({ status: 'error', message: 'Ошибка при отправке сообщения в Telegram.' });
        }
    } catch (error) {
        console.error('Ошибка при отправке сообщения в Telegram:', error.message);
        return res.status(500).json({ status: 'error', message: 'Произошла ошибка при отправке сообщения. Попробуйте позже.' });
    }
});



const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});