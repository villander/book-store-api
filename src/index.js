import app from './config/express';

app.set('port', (process.env.PORT || 3000));

app.listen(app.get('port'), () => {
  console.log(`server started on port ${app.get('port')}`);
});

export default app;
