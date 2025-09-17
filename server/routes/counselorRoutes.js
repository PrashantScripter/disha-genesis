import express from 'express'
import { Response } from '../controllers/counselorResponse.js';
const router = express.Router();

router.post('/getCareerGuidance', Response);

export default router;