const router=require('express').Router();
const c=require('../controllers/cartController');
const {authenticate,authorize}=require('../middleware/authMiddleware');
router.get('/',authenticate,authorize('customer'),c.getCart);
router.post('/',authenticate,authorize('customer'),c.addToCart);
router.put('/:id',authenticate,authorize('customer'),c.updateCart);
router.delete('/:id',authenticate,authorize('customer'),c.removeFromCart);
module.exports=router;
