const express = require('express');
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

const PORT = 3000;

app.get("/", (req, res) => {
    res.send("Hello from backend!");
});


app.post("/api/route", (req, res)=> {
    console.log(req.body);

    res.json({
        success: true,
        message: "Backend recieved your request!"
    });
});




app.listen(PORT, ()=> {
    console.log(`Server running on http://localhost:${PORT}`);
});