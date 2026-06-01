import * as DashboardService from './dashboard.service';

//Given a user id, fetch stats for his/her dashboard.
export const fetchStats = async (req, res) => {
  try {
    const result = await DashboardService.fetchStats(req.userId);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given a user id, fetch recent projects for his/her dashboard.
export const fetchRecentProjects = async (req, res) => {
  try {
    const result = await DashboardService.fetchRecentProjects(req.userId);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given a user id, fetch recent notifications.
export const fetchRecentActivity = async (req, res) => {
  try {
    const result = await DashboardService.fetchRecentActivity(req.userId);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};
