const pool = require('../config/db');

async function listProducts(req, res) {
  try {
    const { category, search } = req.query;
    let sql = `SELECT p.*, u.name vendor_name, c.name category_name
               FROM products p JOIN users u ON u.id=p.vendor_id
               JOIN categories c ON c.id=p.category_id WHERE p.is_active=1`;
    const params = [];
    if (category) { sql += ' AND c.slug=?'; params.push(category); }
    if (search) { sql += ' AND (p.name LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    sql += ' ORDER BY p.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ success:true, products:rows });
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
}

async function createProduct(req,res) {
  try {
    const { name, description, price, stock, category_id, image_url } = req.body;
    const [r] = await pool.query(
      'INSERT INTO products(vendor_id,category_id,name,description,price,stock,image_url) VALUES(?,?,?,?,?,?,?)',
      [req.user.id, category_id, name, description || '', price, stock || 0, image_url || '']
    );
    res.status(201).json({success:true, productId:r.insertId});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
}

async function updateProduct(req,res) {
  try {
    const { name, description, price, stock, category_id, image_url } = req.body;
    const [r] = await pool.query(
      'UPDATE products SET name=?,description=?,price=?,stock=?,category_id=?,image_url=? WHERE id=? AND vendor_id=?',
      [name,description,price,stock,category_id,image_url,req.params.id,req.user.id]
    );
    res.json({success:true, updated:r.affectedRows});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
}

async function deleteProduct(req,res) {
  try {
    await pool.query('UPDATE products SET is_active=0 WHERE id=? AND vendor_id=?',[req.params.id,req.user.id]);
    res.json({success:true,message:'Product removed'});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
}

module.exports = { listProducts, createProduct, updateProduct, deleteProduct };
