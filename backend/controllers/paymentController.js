const pool = require('../config/db');

async function pay(req,res) {
  const {order_id,method='demo'} = req.body;
  const [orders] = await pool.query('SELECT * FROM orders WHERE id=? AND customer_id=?',[order_id,req.user.id]);
  if (!orders.length) return res.status(404).json({success:false,message:'Order not found'});
  const order=orders[0];
  const transactionId = 'TXN-' + Date.now();
  await pool.query(
    'INSERT INTO payments(order_id,amount,method,transaction_id,status) VALUES(?,?,?,?,?)',
    [order.id,order.total_amount,method,transactionId,'paid']
  );
  await pool.query("UPDATE orders SET payment_status='paid' WHERE id=?",[order.id]);
  res.json({success:true,message:'Payment successful',transactionId,receipt:{orderId:order.id,amount:order.total_amount}});
}
module.exports = {pay};
