const router=require('express').Router();
const c=require('../controllers/paymentController');
const {authenticate,authorize}=require('../middleware/authMiddleware');
router.post('/pay',authenticate,authorize('customer'),c.pay);
module.exports=router;
