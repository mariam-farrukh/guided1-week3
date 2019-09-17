const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const db = require('./database/dbConfig.js');
const Users = require('./users/users-model.js');

const server = express();

const sessionConfig = {
  name: "chocochip", // would name the cookie sid by default
  secret: process.env.SESSION_SECRET || 'keep it secret, keep it safe',
  cookie:{
    maxAge: 1000 * 60 * 60, // in milliseconds
    secure: false, // true means only send cookie over https
    httpOnly: true, // true means JS has no access to the cookie
  },
  resave: false,
  saveUninitialized: true, // GDPR compliance
}

server.use(helmet());
server.use(express.json());
server.use(cors());
server.use(session(sessionConfig));

server.get('/', (req, res) => {
  res.send("It's alive!");
});

server.post('/api/register', (req, res) => {
  let user = req.body;

  Users.add(user)
    .then(saved => {
      res.status(201).json(saved);
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

server.post('/api/login', (req, res) => {
  let { username, password } = req.body;

  Users.findBy({ username })
    .first()
    .then(user => {
      if (user) {
        res.status(200).json({ message: `Welcome ${user.username}!` });
      } else {
        res.status(401).json({ message: 'Invalid Credentials' });
      }
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

server.get('/api/users', restricted, (req, res) => {
  Users.find()
    .then(users => {
      res.json(users);
    })
    .catch(err => res.send(err));
});

server.get('/hash', (req, res) => {
  const name = req.query.name;
  const has = ncrypt.hashSync(name, 14);
  res.send(`the hash for ${name} is ${hash}`)
});

// Middleware
function restricted(req, res, next) {
  const { username, password } = req.headers;

  if (username && password) {
      Users.findBy({ username })
          .first()
          .then(user => {
              if (user && bcrypt.compareSync(password, user.password)) {
                  next();
              } else {
                  res.status(401).json({ message: 'Invalid Credentials' });
              }
          })
          .catch(error => {
              res.status(500).json({ message: 'Unexpected error' });
          });
  } else {
      res.status(400).json({ message: 'No credentials provided' });
  }
}

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`\n** Running on port ${port} **\n`));
