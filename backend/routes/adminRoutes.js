const router=require('express').Router();
const c=require('../controllers/adminController');
const {authenticate,authorize}=require('../middleware/authMiddleware');
router.get('/stats',authenticate,authorize('admin'),c.stats);
router.get('/vendors/pending',authenticate,authorize('admin'),c.pendingVendors);
router.put('/vendors/:id/approve',authenticate,authorize('admin'),c.approveVendor);
module.exports=router;
