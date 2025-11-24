const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { body, validationResult, query } = require('express-validator');
const db = require('../db');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// GET /api/products - Get all products with optional pagination, sorting, and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sort').optional().isIn(['name', 'stock', 'category', 'brand']),
  query('order').optional().isIn(['asc', 'desc']),
  query('category').optional().isString(),
  query('name').optional().isString()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const offset = (page - 1) * limit;
  const sortField = req.query.sort || 'id';
  const sortOrder = req.query.order || 'asc';
  const category = req.query.category;
  const name = req.query.name;

  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (name) {
    query += ' AND name LIKE ?';
    params.push(`%${name}%`);
  }

  query += ` ORDER BY ${sortField} ${sortOrder.toUpperCase()} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  db.all(query, params, (err, products) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
    const countParams = [];

    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }

    if (name) {
      countQuery += ' AND name LIKE ?';
      countParams.push(`%${name}%`);
    }

    db.get(countQuery, countParams, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        products,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    });
  });
});

// GET /api/products/search - Search products by name
router.get('/search', [
  query('name').notEmpty().withMessage('Name query parameter is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const searchTerm = `%${req.query.name}%`;
  db.all('SELECT * FROM products WHERE name LIKE ?', [searchTerm], (err, products) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ products });
  });
});

// GET /api/products/:id - Get single product
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  });
});

// POST /api/products - Create new product
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, unit, category, brand, stock, status, image } = req.body;

  db.run(
    'INSERT INTO products (name, unit, category, brand, stock, status, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, unit || null, category || null, brand || null, stock || 0, status || null, image || null],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Product with this name already exists' });
        }
        return res.status(500).json({ error: err.message });
      }

      // Get the created product
      db.get('SELECT * FROM products WHERE id = ?', [this.lastID], (err, product) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json(product);
      });
    }
  );
});

// PUT /api/products/:id - Update product
router.put('/:id', [
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, unit, category, brand, stock, status, image } = req.body;

  // First, get the current product data
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, currentProduct) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!currentProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if name is being changed and if it conflicts with another product
    if (name && name !== currentProduct.name) {
      db.get('SELECT id FROM products WHERE name = ? AND id != ?', [name, id], (err, existing) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (existing) {
          return res.status(400).json({ error: 'Product with this name already exists' });
        }
        performUpdate();
      });
    } else {
      performUpdate();
    }

    function performUpdate() {
      // Build update query dynamically
      const updates = [];
      const values = [];

      if (name !== undefined) updates.push('name = ?'), values.push(name);
      if (unit !== undefined) updates.push('unit = ?'), values.push(unit);
      if (category !== undefined) updates.push('category = ?'), values.push(category);
      if (brand !== undefined) updates.push('brand = ?'), values.push(brand);
      if (stock !== undefined) updates.push('stock = ?'), values.push(stock);
      if (status !== undefined) updates.push('status = ?'), values.push(status);
      if (image !== undefined) updates.push('image = ?'), values.push(image);

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id);

      const updateQuery = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;

      db.run(updateQuery, values, function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Track inventory history if stock changed
        if (stock !== undefined && stock !== currentProduct.stock) {
          db.run(
            'INSERT INTO inventory_history (product_id, old_quantity, new_quantity, change_date, user_info) VALUES (?, ?, ?, ?, ?)',
            [id, currentProduct.stock, stock, new Date().toISOString(), req.headers['user-agent'] || 'Unknown'],
            (err) => {
              if (err) {
                console.error('Error recording inventory history:', err);
              }
            }
          );
        }

        // Get updated product
        db.get('SELECT * FROM products WHERE id = ?', [id], (err, updatedProduct) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json(updatedProduct);
        });
      });
    }
  });
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  });
});

// GET /api/products/:id/history - Get inventory history for a product
router.get('/:id/history', (req, res) => {
  const { id } = req.params;

  db.all(
    'SELECT * FROM inventory_history WHERE product_id = ? ORDER BY change_date DESC',
    [id],
    (err, history) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ history });
    }
  );
});

// POST /api/products/import - Import products from CSV
router.post('/import', upload.single('csvFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded' });
  }

  const filePath = req.file.path;
  const products = [];
  const errors = [];
  let addedCount = 0;
  let skippedCount = 0;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      products.push(row);
    })
    .on('end', () => {
      let processed = 0;

      if (products.length === 0) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: 'CSV file is empty' });
      }

      products.forEach((product, index) => {
        const name = product.name || product.Name || '';
        const unit = product.unit || product.Unit || null;
        const category = product.category || product.Category || null;
        const brand = product.brand || product.Brand || null;
        const stock = parseInt(product.stock || product.Stock || 0);
        const status = product.status || product.Status || null;
        const image = product.image || product.Image || null;

        if (!name) {
          errors.push({ row: index + 1, error: 'Missing product name' });
          skippedCount++;
          processed++;
          checkComplete();
          return;
        }

        // Check for duplicate
        db.get('SELECT id FROM products WHERE name = ?', [name], (err, existing) => {
          if (err) {
            errors.push({ row: index + 1, error: err.message });
            skippedCount++;
            processed++;
            checkComplete();
            return;
          }

          if (existing) {
            skippedCount++;
            processed++;
            checkComplete();
            return;
          }

          // Insert new product
          db.run(
            'INSERT INTO products (name, unit, category, brand, stock, status, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, unit, category, brand, stock, status, image],
            function(err) {
              if (err) {
                errors.push({ row: index + 1, error: err.message });
                skippedCount++;
              } else {
                addedCount++;
              }
              processed++;
              checkComplete();
            }
          );
        });
      });

      function checkComplete() {
        if (processed === products.length) {
          // Clean up uploaded file
          fs.unlinkSync(filePath);
          res.json({
            message: 'Import completed',
            added: addedCount,
            skipped: skippedCount,
            errors: errors.length > 0 ? errors : undefined
          });
        }
      }
    })
    .on('error', (err) => {
      fs.unlinkSync(filePath);
      res.status(500).json({ error: 'Error parsing CSV file: ' + err.message });
    });
});

// GET /api/products/export - Export products as CSV
router.get('/export', (req, res) => {
  db.all('SELECT * FROM products', [], (err, products) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Create CSV header
    const headers = ['id', 'name', 'unit', 'category', 'brand', 'stock', 'status', 'image'];
    let csvData = headers.join(',') + '\n';

    // Add product data
    products.forEach((product) => {
      const row = [
        product.id,
        `"${(product.name || '').replace(/"/g, '""')}"`,
        `"${(product.unit || '').replace(/"/g, '""')}"`,
        `"${(product.category || '').replace(/"/g, '""')}"`,
        `"${(product.brand || '').replace(/"/g, '""')}"`,
        product.stock,
        `"${(product.status || '').replace(/"/g, '""')}"`,
        `"${(product.image || '').replace(/"/g, '""')}"`
      ];
      csvData += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.status(200).send(csvData);
  });
});

// GET /api/products/categories/list - Get unique categories
router.get('/categories/list', (req, res) => {
  db.all('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ""', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const categories = rows.map(row => row.category).filter(Boolean);
    res.json({ categories });
  });
});

module.exports = router;

