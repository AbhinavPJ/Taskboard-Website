import express from 'express';
import {Request, Response, NextFunction} from 'express';
import {authRouter} from './modules/auth/auth.routes';
import {userRouter} from './modules/user/user.routes';
import {projectRouter} from './modules/projects/projects.routes';
import {dashboardRouter} from './modules/dashboard/dashboard.routes';
import {notificationRouter} from './modules/notifications/notifications.routes';
import {boardRouter} from './modules/boards/boards.routes';
import {columnRouter} from './modules/columns/columns.routes';
import {issueRouter} from './modules/issues/issues.routes';
import {commentRouter} from './modules/comments/comments.routes';
import cookieParser from 'cookie-parser';
const app = express();

//This is to enable CORS for our frontend running on a different port (5173).
// In production, we would change localhost to our actual frontend domain.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, DELETE, OPTIONS',
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, DELETE, OPTIONS',
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json({limit: '5mb'})); //This is essential to convert JSON into Objects for our route handlers.
app.use(cookieParser()); //This is essential to parse cookies before our route handlers.
//Below just configures express to parse JSON request bodies and use our route handlers for different API endpoints.
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/projects', projectRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/boards', boardRouter);
app.use('/api/columns', columnRouter);
app.use('/api/issues', issueRouter);
app.use('/api/comments', commentRouter);
app.use('/api/uploads', express.static('uploads')); //This is to serve the avatar images.
//we will use a middleware for error handling, so that we catch all errors in one place
//Error handler MUST be after all routes so it can catch their errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    res.status(500).json({error: err.message, stack: err.stack});
  } else {
    res.status(500).json({error: 'Internal Server Error'});
  }
});
export default app;
