const express = require('express');
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors());

const apiKey = process.env.ORS_API_KEY;


const PORT = 3000;

app.get("/", (req, res) => {
    res.send("Hello from backend!");
});


app.post("/api/route", async(req, res)=> {
    console.log(req.body);

    const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${apiKey}`
        }, 
        body: JSON.stringify(req.body)
        
    }
        
    );

    const data = await response.json();
    console.log('openroute data: ', data);
    res.json(data);
});




app.listen(PORT, ()=> {
    console.log(`Server running on http://localhost:${PORT}`);
});