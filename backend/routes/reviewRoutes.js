const router=require('express').Router();
const c=require('../controllers/reviewController');
const {authenticate,authorize}=require('../middleware/authMiddleware');
router.get('/:productId',c.listReviews);
router.post('/',authenticate,authorize('customer'),c.addReview);
module.exports=router;
