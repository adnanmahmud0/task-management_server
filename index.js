const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(cors());
app.use(express.json());


//DB_USER = task_management
//DB_PASSWORD = qTZg3xsbwbvAeHHZ



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@adnan.f8a3c.mongodb.net/?retryWrites=true&w=majority&appName=adnan`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const tasks = client.db("task_management").collection("task");

        app.post('/tasks', async (req, res) => {
            const task = req.body;
            const result = await tasks.insertOne(task);
            res.json(result);
        })

        app.get('/tasks', async (req, res) => {
            const tasks = task.find();
            const result = await tasks.toArray();
            res.json(result);
        })

        app.put('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const task = req.body;

            const result = await tasks.replaceOne({ _id: id }, task);
            res.json(result);
        })

        app.delete('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const result = await tasks.deleteOne({ _id: id });
            res.json(result);
        })


    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Task management server is online');
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})