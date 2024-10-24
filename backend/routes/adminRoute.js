const { Router } = require('express');
const propertyController = require('../controllers/AuthController')

const router = Router();

router.post('/properties', propertyController.upload_property_post ,()=> {});

router.post('/signup', propertyController.register_post_admin ,()=> {});
router.post('/login', propertyController.login_post_admin ,()=> {});
router.get('/logout', propertyController.logout_get, ()=> {});

router.post('/forget-password', propertyController.forget_password_post, ()=> {});
router.post('/confirm-otp', propertyController.confirm_otp_post, ()=> {});
router.post('/new-password', propertyController.change_password_post, ()=> {});



module.exports = router; // Export the router
