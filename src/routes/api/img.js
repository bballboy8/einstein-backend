var express = require("express");
var router = express.Router();

const ImageController = require("../../controllers/ImageGenerate.controller")

router.post('/dall', ImageController.Dall_E)
router.post('/diffu_xl', ImageController.Stable_Diffusion_XL)
router.post('/diffu_two', ImageController.Stable_Diffusion_Two)
router.post('/gethistory', ImageController.getImgSideData)
router.post('/getType', ImageController.getType)
router.post("/summarize", ImageController.Summarize);
router.get('/getImageDataByID/:id', ImageController.getImageDataByID)


module.exports = router;