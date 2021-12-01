const { MongoClient } = require('mongodb');
const report = require("../report/report");

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
    
        const numberOfReports= await db.collection("reportes").countDocuments({$and:[{anio:report.getCurrentYear()},{mes:report.getCurrentMonth()}]})
        
        console.log(numberOfReports);
        console.log(day)
       
        if(day === 1 && numberOfReports<1)
            await report.saveReport();
        
        
        
            

        

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
