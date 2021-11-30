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
        await client.connect();
        const db = client.db(dbName);
        
        const empleadosCollection = await db.collection("empleados")
    
        const empleados = await empleadosCollection.find({username:username,password:password}).toArray()
        const today = new Date();
        const dia = today.getDate();
        
        if(dia == 1)
            setReportes();

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

setReportes = async () => {
    const client = await new MongoClient(process.env.MONGODB_SERVER);
    const dbName = process.env.DATABASE_NAME;
    
    try {
        await client.connect();
        const db = client.db(dbName);
        
        const clientesCollection = await db.collection("clientes");
        
        const mes = mesActual();
        const anio = anioActual();
        const cantidadClientes = await clienteCantidad(clientesCollection);
        const averageScore = await scorePromedio(clientesCollection);
        const clienteCantidadPorNivel = await cantidadClientePorNivel(clientesCollection);
        const Top3Clientes = await mayoresClientes(clientesCollection);

        const reportesCollection = await db.collection("reportes");

        await reportesCollection.insertOne( 
            {  
                anio: anio,
                mes: mes,
                cantidadClientes: cantidadClientes,
                puntajePromedio: averageScore,
                clienteCantidadPorNivel: clienteCantidadPorNivel,
                Top3Clientes: Top3Clientes
            }     
        );

    }catch(err){
        console.log(err)
    }finally{
        client.close();
    }
}

const mesActual = () => {
    const today = new Date();
    const numeroMes = today.getMonth() == 0 ? 12 : today.getMonth();
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
                    "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const mes = meses[numeroMes - 1];

    console.log("------------------------------");
    console.log(mes);
    return mes;
}

const anioActual = () => {
    const today = new Date();
    const anio = today.getMonth() == 0 ? today.getFullYear() - 1 : today.getFullYear();

    console.log(anio);
    return anio;
}

const clienteCantidad = async (clientesCollection) => {
    const cantidadClientes = await clientesCollection.countDocuments({Status:"Enabled"});

    console.log(cantidadClientes);
    return cantidadClientes;
}

const scorePromedio = async (clientesCollection) => {
    const promedio =  await clientesCollection.aggregate([{$match:{Status:"Enabled"}},{$group:{ _id: "_id",average_cred_score: { $avg: "$CreditScore" }}}]).toArray();
    
    console.log(promedio[0].average_cred_score);
    return promedio[0].average_cred_score;
}

const cantidadClientePorNivel = async (clientesCollection) => {
    const clientes = await clientesCollection.find({Status:"Enabled"},{"CreditScore":1, "_id":0}).toArray();
    let niveles = {
        buenos: 0,
        regulares: 0,
        malos: 0
    }

    clientes.forEach(cliente => {
        if(cliente.CreditScore >= 667)
            niveles.buenos++;
        else if(cliente.CreditScore <= 666 && cliente.CreditScore >= 333)
            niveles.regulares++;
        else
            niveles.malos++;
    });

    console.log(niveles)
    return niveles;
}

const mayoresClientes = async (clientesCollection) => {
    const clientes = await clientesCollection.find({Status:"Enabled"},{"FirstName": 1,"MiddleName":1,"LastName":1,"CreditScore":1, "_id":0}).toArray();
    let clienteNombres = [];
    let scores = [];
    let resultado = []

    clientes.forEach(cliente => {
        let secondName = cliente.MiddleName == "" ? "" : " " + cliente.MiddleName;
        clienteNombres.push(cliente.FirstName + secondName + " " + cliente.LastName);
        scores.push(cliente.CreditScore);
    })

    for(let i=0; i < 3; i++){
        const getMaxOfArray = (array) => {
            return Math.max.apply(null, array);
        }
        let maximo = getMaxOfArray(scores);
        let nombre = clienteNombres[scores.indexOf(maximo)];
        resultado.push({nombre:nombre, score:maximo});
        scores.splice(scores.indexOf(maximo), 1);
        clienteNombres.splice(scores.indexOf(maximo), 1);

    }

    console.log(resultado);
    console.log("-----------------------------------------");
    return resultado;

}




module.exports = {
    login:login,
    
  };
