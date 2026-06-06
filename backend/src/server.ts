import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/projectRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', projectRoutes);

app.get('/', (req, res) => {
  res.send('Supervision Management System API is running.');
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
