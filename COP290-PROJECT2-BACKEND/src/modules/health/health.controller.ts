import * as HealthService from './health.service';

//Just a simple endpoint to check if server is running fine.
export const getHealth = async (req, res) => {
  const health = await HealthService.getHealth();
  res.json(health);
};
