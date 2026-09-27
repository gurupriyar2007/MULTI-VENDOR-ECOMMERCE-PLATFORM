const pool = require('../config/db');

async function getCart(req,res) {
  const [rows] = await pool.query(
    `SELECT ci.id,ci.product_id,ci.quantity,p.name,p.price,p.image_url
     FROM cart_items ci JOIN carts c ON c.id=ci.cart_id
     JOIN products p ON p.id=ci.product_id WHERE c.customer_id=?`,[req.user.id]
  );
  res.json({success:true,items:rows});
}

async function addToCart(req,res) {
  const {product_id, quantity=1} = req.body;
  const [carts] = await pool.query('SELECT id FROM carts WHERE customer_id=?',[req.user.id]);
  let cartId = carts[0]?.id;
  if (!cartId) {
    const [r] = await pool.query('INSERT INTO carts(customer_id) VALUES(?)',[req.user.id]);
    cartId=r.insertId;
  }
  await pool.query(
    `INSERT INTO cart_items(cart_id,product_id,quantity) VALUES(?,?,?)
     ON DUPLICATE KEY UPDATE quantity=quantity+VALUES(quantity)`,
    [cartId,product_id,quantity]
  );
  res.json({success:true,message:'Added to cart'});
}

async function updateCart(req,res) {
  await pool.query(
    `UPDATE cart_items ci JOIN carts c ON c.id=ci.cart_id SET ci.quantity=?
     WHERE ci.id=? AND c.customer_id=?`,
    [req.body.quantity,req.params.id,req.user.id]
  );
  res.json({success:true});
}

async function removeFromCart(req,res) {
  await pool.query(
    `DELETE ci FROM cart_items ci JOIN carts c ON c.id=ci.cart_id WHERE ci.id=? AND c.customer_id=?`,
    [req.params.id,req.user.id]
  );
  res.json({success:true});
}
module.exports = {getCart,addToCart,updateCart,removeFromCart};
