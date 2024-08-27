const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./models/user');
const Task = require('./models/task');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Session setup
app.use(session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: true
}));

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/ToDoApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
.catch(err => console.error(err));

// Middleware for checking login status
function checkAuth(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Routes
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await user.comparePassword(password)) {
        req.session.userId = user._id;
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = new User({ username, password });
        await user.save();
        res.redirect('/login');
    } catch (err) {
        res.redirect('/register');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

app.get('/', checkAuth, (req, res) => {
    Task.find({ userId: req.session.userId })
        .then(tasks => res.render('index', { tasks }))
        .catch(err => res.sendStatus(500));
});

app.post('/tasks', checkAuth, (req, res) => {
    const newTask = new Task({ title: req.body.title, userId: req.session.userId });
    newTask.save()
        .then(() => res.redirect('/'))
        .catch(err => console.error(err));
});

app.post('/tasks/complete/:id', checkAuth, (req, res) => {
    Task.findOneAndUpdate(
        { _id: req.params.id, userId: req.session.userId },
        { completed: req.body.completed === 'true' }
    )
    .then(() => res.redirect('/'))
    .catch(err => console.error(err));
});

app.post('/tasks/delete/:id', checkAuth, (req, res) => {
    Task.findOneAndDelete({ _id: req.params.id, userId: req.session.userId })
        .then(() => res.redirect('/'))
        .catch(err => console.error(err));
});

app.get('/edit/:id', checkAuth, (req, res) => {
    Task.findOne({ _id: req.params.id, userId: req.session.userId })
        .then(task => res.render('edit', { task }))
        .catch(err => res.sendStatus(500));
});

app.post('/edit/:id', checkAuth, (req, res) => {
    Task.findOneAndUpdate({ _id: req.params.id, userId: req.session.userId }, { title: req.body.title })
        .then(() => res.redirect('/'))
        .catch(err => console.error(err));
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

// Rute untuk logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.redirect('/');
        }
        res.redirect('/login');
    });
});
