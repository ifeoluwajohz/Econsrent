const { Router } = require('express');
const propertyController = require('../controllers/AuthController')

const router = Router();

router.get('/properties', propertyController.get_all ,()=> {});
router.get('/properties/:id', propertyController.get_by_id ,()=> {});


module.exports = router; // Export the router
