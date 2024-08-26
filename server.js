const express = require('express');
const mongoose = require('mongoose');
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Menghubungkan ke MongoDB menggunakan Mongoose tanpa opsi deprecated
mongoose.connect('mongodb://127.0.0.1:27017/ToDoApp')
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(3000, () => {
            console.log('Server running on http://localhost:3000');
        });
    })
    .catch(err => console.error('Failed to connect to MongoDB:', err));

// Membuat skema dan model untuk tugas
const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    completed: { type: Boolean, default: false }
});

const Task = mongoose.model('Task', taskSchema);

// Rute untuk menampilkan semua tugas
app.get('/', (req, res) => {
    Task.find()
        .then(tasks => res.render('index', { tasks }))
        .catch(err => {
            console.error(err);
            res.sendStatus(500);
        });
});

// Rute untuk menambahkan tugas baru
app.post('/tasks', (req, res) => {
    const newTask = new Task({ title: req.body.title });
    newTask.save()
        .then(() => res.redirect('/'))
        .catch(err => {
            console.error(err);
            res.sendStatus(500);
        });
});

// Rute untuk menampilkan form edit tugas
app.get('/edit/:id', (req, res) => {
    Task.findById(req.params.id)
        .then(task => res.render('edit', { task }))
        .catch(err => {
            console.error(err);
            res.sendStatus(500);
        });
});

// Rute untuk memperbarui tugas
app.post('/tasks/:id', (req, res) => {
    Task.findByIdAndUpdate(req.params.id, { title: req.body.title })
        .then(() => res.redirect('/'))
        .catch(err => {
            console.error(err);
            res.sendStatus(500);
        });
});

// Rute untuk menghapus tugas
app.post('/tasks/delete/:id', (req, res) => {
    Task.findByIdAndDelete(req.params.id)
        .then(() => res.redirect('/'))
        .catch(err => {
            console.error(err);
            res.sendStatus(500);
        });
});

// Rute untuk menandai tugas sebagai selesai atau tidak selesai
app.post('/tasks/complete/:id', (req, res) => {
    Task.findById(req.params.id)
        .then(task => {
            // Toggle status completed
            task.completed = !task.completed;
            return task.save();
        })
        .then(() => res.redirect('/'))
        .catch(err => {
            console.error(err);
            res.sendStatus(500);
        });
});
