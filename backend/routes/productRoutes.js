const router=require('express').Router();
const c=require('../controllers/productController');
const {authenticate,authorize}=require('../middleware/authMiddleware');
router.get('/',c.listProducts);
router.post('/',authenticate,authorize('vendor'),c.createProduct);
router.put('/:id',authenticate,authorize('vendor'),c.updateProduct);
router.delete('/:id',authenticate,authorize('vendor'),c.deleteProduct);
module.exports=router;
