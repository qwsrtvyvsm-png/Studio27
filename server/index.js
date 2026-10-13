require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const { pool, initSchema } = require('./db');
const authRoutes = require('./routes/auth');
const publicRoutes = require('./routes/public');
const applicationsRoutes = require('./routes/applications');
const enquiriesRoutes = require('./routes/enquiries');
const modelsRoutes = require('./routes/models');
const divisionsRoutes = require('./routes/divisions');
const settingsRoutes = require('./routes/settings');

const ROOT = path.join(__dirname, '..');
const app = express();

app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new pgSession({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 12
    }
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/enquiries', enquiriesRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/divisions', divisionsRoutes);
app.use('/api/settings', settingsRoutes);

/* ---------- Static site & admin dashboard ----------
   Explicit allowlist rather than serving the whole repo root, so
   server/ source, package.json etc. are never reachable over HTTP. */
app.use('/css', express.static(path.join(ROOT, 'css')));
app.use('/js', express.static(path.join(ROOT, 'js')));
app.use('/images', express.static(path.join(ROOT, 'images')));
app.use('/admin', express.static(path.join(ROOT, 'admin')));

app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));

app.get('/:page.html', (req, res, next) => {
  res.sendFile(path.join(ROOT, `${req.params.page}.html`), (err) => {
    if (err) next();
  });
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.status(404).sendFile(path.join(ROOT, '404.html'), (err) => {
    if (err) res.status(404).send('Not found');
  });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/api/')) return res.status(500).json({ error: 'Server error' });
  res.status(500).send('Server error');
});

const port = process.env.PORT || 3000;

initSchema()
  .then(() => {
    app.listen(port, () => console.log(`Studio 27 server listening on port ${port}`));
  })
  .catch((err) => {
    console.error('Failed to initialise database schema', err);
    process.exit(1);
  });
