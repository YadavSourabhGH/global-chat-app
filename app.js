const fs = require('fs');
const express = require('express');
const cors = require('cors'); // Import cors
const path = require('path');
const app = express();
const port = 3000;

// Use CORS middleware
app.use(cors());

app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public'))); 

const filePath = './data.json';
const usernamesFilePath = './usernames.json';

let messages = [];
let lastMsgNum = 0;
let usernames = new Set(); 

const loadUsernames = () => {
    try {
        const data = fs.readFileSync(usernamesFilePath, 'utf-8');
        const storedUsernames = JSON.parse(data);
        storedUsernames.forEach(username => usernames.add(username));
    } catch (error) {
        console.error("Error reading usernames from file:", error);
    }
};

const saveUsernames = () => {
    try {
        fs.writeFileSync(usernamesFilePath, JSON.stringify(Array.from(usernames), null, 2));
    } catch (error) {
        console.error("Error writing usernames to file:", error);
    }
};

const loadMessages = () => {
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        messages = JSON.parse(data);
        lastMsgNum = messages.length ? messages[messages.length - 1].msgnum : 0; 

        messages.forEach(msg => {
            usernames.add(msg.username);
        });
    } catch (error) {
        console.error("Error reading messages from file:", error);
        messages = []; // Reset messages if there was an error
        lastMsgNum = 0; // Reset lastMsgNum
    }
};

loadUsernames();
loadMessages();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Serve index.html
});

app.post('/send', (req, res) => {
    const { msg, username } = req.body;

    if (msg && username) {
        lastMsgNum++; // Increment last message number
        const newMessage = { msgnum: lastMsgNum, username, msg };
        messages.push(newMessage); // Store message

        fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));
        
        res.sendStatus(200); // Send response
    } else {
        res.sendStatus(400); // Bad request
    }
});

app.post('/getlatestmsg', (req, res) => {
    const { fromid } = req.body;
    lastMsgNum = 0;
    loadUsernames();
    loadMessages();

    if (typeof fromid !== 'number') {
        return res.status(400).json({ error: 'fromid must be a number' });
    }

    const newMessages = messages.filter(msg => msg.msgnum >= fromid);
    res.json(newMessages);
});

app.post('/setusername', (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    if (usernames.has(username)) {
        return res.status(409).json({ error: 'Username already taken' });
    }

    usernames.add(username);
    saveUsernames(); // Save updated usernames to the file
    res.sendStatus(200); // Successfully changed username
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
