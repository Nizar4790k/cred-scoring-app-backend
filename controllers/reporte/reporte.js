const { MongoClient } = require('mongodb');

const queryReports = async (res)=>{

    const reports = await getReports();
    

    if(!reports){
        return res.status(404).json({message:"No hay reportes"});
    }

    return res.status(200).json({reports});


}

const getReports = async ()=>{
    
    const client = await new MongoClient(process.env.MONGODB_SERVER);
    const dbName = process.env.DATABASE_NAME;
    
    try {
        await client.connect();
        const db = client.db(dbName);
        
        const reportesCollection = await db.collection("reportes")
    
        const today = new Date();
        const anio = today.getFullYear();

        const reportes = await reportesCollection.find({anio:anio}).toArray();
        
        const meses = setMeses(reportes);
        const cantidadClientes = setCantidadClientes(reportes);
        const scoresPromedio = setScoresPromedio(reportes);
        const nivelActual = setNivelActual(reportes);
        const top3Actual = setTop3Actual(reportes);

        return {
            meses: meses,
            cantidadClientes: cantidadClientes,
            scoresPromedio: scoresPromedio,
            nivelActual: nivelActual,
            top3Actual: top3Actual
        };

    }catch(err){
        console.log(err)
    }finally{
        client.close();
    }

    
}

const setMeses = (reportes) => {
    let meses = [];
    
    reportes.forEach(reporte => {
        meses.push(reporte.mes)
    });

    return meses;
}

const setCantidadClientes = (reportes) => {
    let cantidadClientes = [];

    reportes.forEach(reporte => {
        cantidadClientes.push(reporte.cantidadClientes)
    });

    
    return cantidadClientes;
}

const setScoresPromedio = (reportes) => {
    let scoresPromedio = [];

    reportes.forEach(reporte => {
        scoresPromedio.push(parseInt(reporte.puntajePromedio.toFixed()))
    });

    return scoresPromedio;
}

const setNivelActual = (reportes) => {
    const nivelActual = reportes[reportes.length - 1].clienteCantidadPorNivel;

    return nivelActual;
}

const setTop3Actual = (reportes) => {
    const top3 = reportes[reportes.length - 1].Top3Clientes;

    return top3;
}

const setReportes = async () => {
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

    return mes;
}

const anioActual = () => {
    const today = new Date();
    const anio = today.getMonth() == 0 ? today.getFullYear() - 1 : today.getFullYear();

    return anio;
}

const clienteCantidad = async (clientesCollection) => {
    const cantidadClientes = await clientesCollection.countDocuments({Status:"Enabled"});

    return cantidadClientes;
}

const scorePromedio = async (clientesCollection) => {
    const promedio =  await clientesCollection.aggregate([{$match:{Status:"Enabled"}},{$group:{ _id: "_id",averageCredScore: { $avg: "$CreditScore" }}}]).toArray();
    
    
    return promedio[0].averageCredScore;
}

const cantidadClientePorNivel = async (clientesCollection) => {
   
    const countClientes = await clientesCollection.aggregate([
        { "$facet": {
          "Malo": [
            { "$match" :  {$and:[{CreditScore:{$gt:0,$lt:333}},{Status:"Enabled"}]}},
            { "$count": "Malo" },
          ],
          "Regular": [
            { "$match" : {$and:[{CreditScore:{$gt:332,$lt:667}},{Status:"Enabled"}]}},
            { "$count": "Regular" }
          ],
          "Bueno": [
            { "$match" :  {$and:[{CreditScore:{$gt:666,$lt:1001}},{Status:"Enabled"}]}},
            { "$count": "Bueno" }
          ]
        }},
        { "$project": {
          "malos": { "$arrayElemAt": ["$Malo.Malo", 0] },
          "regulares": { "$arrayElemAt": ["$Regular.Regular", 0] },
          "buenos": { "$arrayElemAt": ["$Bueno.Bueno", 0] }
        }}

      ]).toArray();
   
  

      let niveles = {
            buenos: countClientes[0].buenos ? countClientes[0].buenos : 0,
            regulares:countClientes[0].regulares ? countClientes[0].regulares : 0,
            malos:countClientes[0].malos ? countClientes[0].malos : 0,
      }

      

    
      
   
    

   
    return niveles;
}

const mayoresClientes = async (clientesCollection) => {
    
    
    const clientes = await clientesCollection.find({Status:"Enabled"},{"FirstName": 1,"MiddleName":1,"LastName":1,"CreditScore":1, "_id":0}).sort({"CreditScore":-1}).limit(3).toArray();
    let resultado = []

    


    clientes.forEach(cliente => {
        let secondName = cliente.MiddleName == "" ? "" : " " + cliente.MiddleName;
        resultado.push({nombre:cliente.FirstName + secondName + " " + cliente.LastName,scores:cliente.CreditScore});
    })

    

    return resultado;
    
    /*
    
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
    */
    
 



}


module.exports = {
    queryReports:queryReports,
    setReportes:setReportes
}