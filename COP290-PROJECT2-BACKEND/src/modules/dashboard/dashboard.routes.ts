import {Router} from 'express';
import {Authenticate} from '../../core/middleware/auth';
import {
  fetchStats,
  fetchRecentProjects,
  fetchRecentActivity,
} from './dashboard.controller';

const router = Router();

//The below endpoint allows us to fetch dashboard stats for a user.
router.get('/stats', Authenticate, fetchStats);

//The below endpoint allows us to fetch recent projects for a user.
router.get('/recent-projects', Authenticate, fetchRecentProjects);

//The below endpoint allows us to fetch recent notifications for a user.
router.get('/recent-activity', Authenticate, fetchRecentActivity);

export const dashboardRouter = router;
