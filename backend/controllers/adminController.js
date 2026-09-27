const pool = require('../config/db');

async function stats(req,res) {
  const [[users]] = await pool.query('SELECT COUNT(*) count FROM users');
  const [[products]] = await pool.query('SELECT COUNT(*) count FROM products WHERE is_active=1');
  const [[orders]] = await pool.query('SELECT COUNT(*) count FROM orders');
  const [[revenue]] = await pool.query("SELECT COALESCE(SUM(total_amount),0) total FROM orders WHERE payment_status='paid'");
  res.json({success:true,stats:{users:users.count,products:products.count,orders:orders.count,revenue:revenue.total}});
}

async function pendingVendors(req,res) {
  const [rows] = await pool.query("SELECT id,name,email,created_at FROM users WHERE role='vendor' AND vendor_status='pending'");
  res.json({success:true,vendors:rows});
}

async function approveVendor(req,res) {
  await pool.query("UPDATE users SET vendor_status='approved' WHERE id=? AND role='vendor'",[req.params.id]);
  res.json({success:true,message:'Vendor approved'});
}

module.exports = {stats,pendingVendors,approveVendor};
