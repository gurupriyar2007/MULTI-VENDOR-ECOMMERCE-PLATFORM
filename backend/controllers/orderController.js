const pool = require('../config/db');

async function createOrder(req,res) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [cart] = await conn.query(
      `SELECT ci.product_id, ci.quantity, p.price, p.vendor_id
       FROM cart_items ci JOIN products p ON p.id=ci.product_id
       JOIN carts c ON c.id=ci.cart_id
       WHERE c.customer_id=?`, [req.user.id]
    );
    if (!cart.length) throw new Error('Cart is empty');

    const total = cart.reduce((s,i)=>s + Number(i.price)*i.quantity,0);
    const [order] = await conn.query(
      'INSERT INTO orders(customer_id,total_amount,status,payment_status) VALUES(?,?,?,?)',
      [req.user.id,total,'placed','pending']
    );
    for (const item of cart) {
      await conn.query(
        'INSERT INTO order_items(order_id,product_id,vendor_id,quantity,unit_price) VALUES(?,?,?,?,?)',
        [order.insertId,item.product_id,item.vendor_id,item.quantity,item.price]
      );
      await conn.query('UPDATE products SET stock=stock-? WHERE id=? AND stock>=?', [item.quantity,item.product_id,item.quantity]);
    }
    await conn.query('DELETE ci FROM cart_items ci JOIN carts c ON c.id=ci.cart_id WHERE c.customer_id=?',[req.user.id]);
    await conn.commit();
    res.status(201).json({success:true,orderId:order.insertId,total});
  } catch(e) {
    await conn.rollback();
    res.status(400).json({success:false,message:e.message});
  } finally { conn.release(); }
}

async function customerOrders(req,res) {
  const [rows] = await pool.query(
    'SELECT * FROM orders WHERE customer_id=? ORDER BY created_at DESC',[req.user.id]
  );
  res.json({success:true,orders:rows});
}

async function vendorOrders(req,res) {
  const [rows] = await pool.query(
    `SELECT DISTINCT o.*, u.name customer_name FROM orders o
     JOIN order_items oi ON oi.order_id=o.id JOIN users u ON u.id=o.customer_id
     WHERE oi.vendor_id=? ORDER BY o.created_at DESC`,[req.user.id]
  );
  res.json({success:true,orders:rows});
}

async function updateOrderStatus(req,res) {
  const allowed = ['placed','confirmed','packed','shipped','delivered','cancelled'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({success:false,message:'Invalid status'});
  await pool.query(
    `UPDATE orders o JOIN order_items oi ON oi.order_id=o.id
     SET o.status=? WHERE o.id=? AND oi.vendor_id=?`,
    [req.body.status,req.params.id,req.user.id]
  );
  res.json({success:true,message:'Order status updated'});
}

module.exports = {createOrder,customerOrders,vendorOrders,updateOrderStatus};
