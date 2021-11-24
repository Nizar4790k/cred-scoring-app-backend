const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const creditscoring = require('./controllers/creditscoring');
const cliente = require('./controllers/cliente');
const database = require('./database/database');


dotenv.config()

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());




database.testDatabase();



app.get('/creditscoring', (req, res) => {

});

app.post('/cliente_login', async (req, res) => {


 return cliente.login(req, res);
    
});


app.listen(process.env.PORT || 3001, () => {
    console.log(`Server running on port: ${process.env.PORT || 3001}`);
})

