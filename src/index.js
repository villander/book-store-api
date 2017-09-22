import app from './config/express';

app.set('port', (process.env.PORT || 3000));

app.listen(3000, () => {
  console.log('server started on port 3000');
});

export default app;
