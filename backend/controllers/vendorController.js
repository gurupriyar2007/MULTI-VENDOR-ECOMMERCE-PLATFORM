const pool = require('../config/db');

async function dashboard(req,res) {
  const [[sales]] = await pool.query(
    `SELECT COALESCE(SUM(oi.quantity*oi.unit_price),0) sales,
            COUNT(DISTINCT oi.order_id) orders,
            COUNT(DISTINCT oi.product_id) products
     FROM order_items oi WHERE oi.vendor_id=?`,[req.user.id]
  );
  res.json({success:true,stats:sales});
}
module.exports = {dashboard};
