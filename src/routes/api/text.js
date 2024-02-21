var express = require("express");
var router = express.Router();

const TextGenerateController = require("../../controllers/TextGenerate.controller");

router.post('/gpt4', TextGenerateController.GPT4);
router.post('/gpt3', TextGenerateController.GPT3);
router.post('/gemini', TextGenerateController.Gemini)
router.post('/mistral', TextGenerateController.Mistral)
router.post('/perplexityai', TextGenerateController.Perplexity)
router.post('/search', TextGenerateController.Search)
router.post('/clear', TextGenerateController.clearHistory)
router.post('/gethistory', TextGenerateController.GetHistory)
router.get('/gethistoryByID/:id', TextGenerateController.GetHistoryDataByID)
router.post('/summarize', TextGenerateController.Summarize)
router.post('/getType', TextGenerateController.getType)
router.post('/regenerate', TextGenerateController.Regenerate)

module.exports = router;