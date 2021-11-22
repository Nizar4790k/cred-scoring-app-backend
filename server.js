const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config()

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors());

app.listen(process.env.PORT|| 3001,()=>{
    console.log(`Server running on port: ${process.env.PORT || 3001}`);
})
