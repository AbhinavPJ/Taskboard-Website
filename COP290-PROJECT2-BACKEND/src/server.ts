import 'dotenv/config';
import app from './app';
import {PORT} from './core/config/constants';
//START THE SERVER, LISTEN ON PORT!
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
