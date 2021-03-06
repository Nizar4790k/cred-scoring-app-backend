const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const customer = require('./controllers/customer/customer');
const database = require('./database/database');
const empleado = require('./controllers/empleado/empleado');
const report = require('./controllers/report/report');


dotenv.config()

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());



database.testDatabase();



app.post('/detalle_cliente', async (req, res) => {
  return  await customer.getCustomerDetails(req,res);
});

app.post('/empleado_login',async (req,res)=>{
   return await empleado.login(req,res);
});

app.post('/cliente_login', async (req, res) => {
 return customer.login(req, res); 
});

app.get('/reporte', async (req, res) => {
  return await report.queryReports(res)
 });


app.listen(process.env.PORT || 3001, () => {
    console.log(`Server running on port: ${process.env.PORT || 3001}`);
})

