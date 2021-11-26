const { MongoClient } = require('mongodb');

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
        client.connect();
        const db = client.db(dbName);
        
        const empleadosCollection = await db.collection("empleados")
    
        const empleados = await empleadosCollection.find({username:username,password:password}).toArray()
        
        if(empleados[0]){
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