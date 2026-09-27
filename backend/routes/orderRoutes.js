const router=require('express').Router();
const c=require('../controllers/orderController');
const {authenticate,authorize}=require('../middleware/authMiddleware');
router.post('/',authenticate,authorize('customer'),c.createOrder);
router.get('/customer',authenticate,authorize('customer'),c.customerOrders);
router.get('/vendor',authenticate,authorize('vendor'),c.vendorOrders);
router.put('/:id/status',authenticate,authorize('vendor'),c.updateOrderStatus);
module.exports=router;
