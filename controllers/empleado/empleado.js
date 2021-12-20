const { MongoClient } = require('mongodb');
const report = require("../report/report");
const datos = require("../datos/datos");
const email = require("../email/email");

const login = async (req,res)=>{

    const  {username,password} = req.body;

    const employeeExist = await checkEmployee(username,password)

    if(!employeeExist){
        return res.status(404).json({message:"Empleado no registrado"});
    }

    return res.status(200).json(); 


}

const checkEmployee = async (username,password)=>{
    
    const client = await new MongoClient(process.env.MONGODB_SERVER);
    const dbName = process.env.DATABASE_NAME;
    
    try {
        await client.connect();
        const db = client.db(dbName);
        
        const employeeCollection = await db.collection("empleados")
        

        const employees = await employeeCollection.find({username:username,password:password}).toArray()
        const today = new Date();
        const day = today.getDate();
        const currentDate = datos.normalDate();
        const numberOfReports= await db.collection("reportes").countDocuments({$and:[{anio:datos.getCurrentYear()},{mes:datos.getCurrentMonth()}]})
        const numberOfEmils= await db.collection("correos").countDocuments({$and:[{dia:currentDate.day},{mes:currentDate.month},{anio:currentDate.year}]})
       
        if(day === 1){
            if(numberOfReports<1)
                report.saveReport();
            if(numberOfEmils<1)
                email.emails();
        }

        if(employees[0]){
            return true;
        }else{
            return false;
        }

    }catch(err){
        console.log(err)
    }finally{
        client.close();
    }

    
}

module.exports = {
    login:login,
    
  };
