const pool = require('../config/db');

async function addReview(req,res) {
  const {product_id,rating,comment} = req.body;
  const [purchased] = await pool.query(
    `SELECT oi.id FROM order_items oi JOIN orders o ON o.id=oi.order_id
     WHERE o.customer_id=? AND oi.product_id=? AND o.status='delivered' LIMIT 1`,
    [req.user.id,product_id]
  );
  if (!purchased.length) return res.status(403).json({success:false,message:'You can review only purchased and delivered products'});
  await pool.query(
    `INSERT INTO reviews(product_id,customer_id,rating,comment) VALUES(?,?,?,?)
     ON DUPLICATE KEY UPDATE rating=VALUES(rating),comment=VALUES(comment)`,
    [product_id,req.user.id,rating,comment||'']
  );
  res.json({success:true,message:'Review submitted'});
}

async function listReviews(req,res) {
  const [rows] = await pool.query(
    `SELECT r.*,u.name customer_name FROM reviews r JOIN users u ON u.id=r.customer_id
     WHERE r.product_id=? ORDER BY r.created_at DESC`,[req.params.productId]
  );
  res.json({success:true,reviews:rows});
}
module.exports = {addReview,listReviews};
