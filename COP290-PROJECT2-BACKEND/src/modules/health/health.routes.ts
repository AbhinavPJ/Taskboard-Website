import {Router} from 'express';
import {getHealth} from './health.controller';

const router = Router();

//The below end point allows us to check if the Server is running fine.
router.get('/health', getHealth);

export const healthRouter = router;
