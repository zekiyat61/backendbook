import express from 'express';
import cors from 'cors'; // Importing cors

const app = express();
const PORT = 5555;

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

app.post('/user/login', (req, res) => {
    const { username, password } = req.body;
    // Example authentication logic
    if (username === "testuser" && password === "testpass") {
        res.status(200).json({ token: "your_generated_token", username });
    } else {
        res.status(401).json({ message: "Invalid username or password" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});