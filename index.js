const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const { ObjectId } = require('mongodb');
const { MongoClient, ServerApiVersion } = require('mongodb');
const http = require('http');
const { Server } = require('socket.io');

const port = process.env.PORT || 3000;

// Create an HTTP server and set up Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins for development. Adjust in production.
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@adnan.f8a3c.mongodb.net/?retryWrites=true&w=majority&appName=adnan`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const tasks = client.db("task_management").collection("task");

        // Change Streams for Real-Time Updates
        const changeStream = tasks.watch();
        changeStream.on('change', async (change) => {

            if (change.operationType === 'update') {
                const updatedTask = await tasks.findOne({ _id: new ObjectId(change.documentKey._id) });
                io.emit('taskUpdated', updatedTask); // Emit the updated task to all clients
            }
        });


        // POST - Add a task
        app.post('/tasks', async (req, res) => {
            try {
                const task = req.body;
                const result = await tasks.insertOne(task);
                res.json(result);
            } catch (error) {
                console.error('Error adding task:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        app.get('/tasks', async (req, res) => {
            const userEmail = req.query.email;
            try {
                const data = tasks.find({ email: userEmail }); // Filter by email
                const result = await data.toArray();
                res.json(result);
            } catch (error) {
                console.error('Error fetching tasks:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });


        // PUT - Update a task
        app.put('/tasks/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const updateData = req.body;
                delete updateData._id;

                const result = await tasks.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({ error: 'Task not found' });
                }

                // Emit updated task data
                const updatedTask = await tasks.findOne({ _id: new ObjectId(id) });
                io.emit('taskUpdated', updatedTask);

                res.json(updatedTask);
            } catch (error) {
                console.error('Error updating task:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });


        // DELETE - Delete a task
        app.delete('/tasks/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) };
                const result = await tasks.deleteOne(filter);

                if (result.deletedCount === 0) {
                    return res.status(404).json({ error: 'Task not found' });
                }

                res.json({ message: 'Task deleted successfully' });
            } catch (error) {
                console.error('Error deleting task:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

    } finally {
        // Uncomment to close the client when needed
        // await client.close();
    }
}
run().catch(console.dir);

// Socket.IO Connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.get('/', (req, res) => {
    res.send('Task management server is online');
});

// Use server.listen instead of app.listen
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
