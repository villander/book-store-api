import app from './config/express';

app.listen(3000, () => {
  console.log('server started on port 3000');
});

export default app;
