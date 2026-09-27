const router=require('express').Router();
const c=require('../controllers/vendorController');
const {authenticate,authorize}=require('../middleware/authMiddleware');
router.get('/dashboard',authenticate,authorize('vendor'),c.dashboard);
module.exports=router;
