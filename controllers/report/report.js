const { MongoClient } = require('mongodb');

const queryReports = async (res)=>{

  try{
    const reportes = await getReports();
    

    if(!reportes){
        return res.status(404).json({message:"No hay reportes"});
    }

    return res.status(200).json({reportes});

  }catch(err){
    return res.status(500).json({message:"Error en el servidor"});
  }

}

const getReports = async ()=>{
    
    const client = await new MongoClient(process.env.MONGODB_SERVER);
    const dbName = process.env.DATABASE_NAME;
    
    try {
        await client.connect();
        const db = client.db(dbName);
        
        const reportCollections = await db.collection("reportes")
    
        const today = new Date();
        const year = today.getFullYear();

        const reports = await reportCollections.find({anio:year}).toArray();
        
        const months = pushMonths(reports);
        const customerQuantity = pushCustomerQuantity(reports);
        const averageScore = pushAverageScore(reports);
        const currentLevel = pushCurrentLevel(reports); // This method measures the customers with good, regular and bad,
        const currentTop3 = pushCurrentTop3Customers(reports);

        return {
            meses: months,
            cantidadClientes: customerQuantity,
            averageScores: averageScore,
            currentLevel: currentLevel,
            top3Actual: currentTop3
        };

    }catch(err){
        console.log(err)
    }finally{
        client.close();
    }

    
}

const pushMonths = (reports) => {
    let month = [];
    
    reports.forEach(reporte => {
        month.push(reporte.mes)
    });

    return month;
}

const pushCustomerQuantity = (reports) => {
    let customerQuantity = [];

    reports.forEach(report => {
        customerQuantity.push(report.cantidadClientes)
    });

    
    return customerQuantity;
}

const pushAverageScore = (reports) => {
    let averageScores = [];

    reports.forEach(report => {
        averageScores.push(parseInt(report.puntajePromedio.toFixed()))
    });

    return averageScores;
}

const pushCurrentLevel = (reports) => {
    const currentLevel = reports[reports.length - 1].clienteCantidadPorNivel;

    return currentLevel;
}

const pushCurrentTop3Customers = (reports) => {
    const top3CurrentCustomers = reports[reports.length - 1].Top3Clientes;

    return top3CurrentCustomers;
}

const saveReport = async () => {
    const client = await new MongoClient(process.env.MONGODB_SERVER);
    const dbName = process.env.DATABASE_NAME;
    
    try {
        await client.connect();
        const db = client.db(dbName);
        
        const customerCollection = await db.collection("clientes");
        
        const month = getCurrentMonth();
        const year = getCurrentYear();
        const customerQuantity = await getCustomerQuantity(customerCollection);
        const averageScore = await getAverageScore(customerCollection);
        const customerQuantityByLevel = await getCustomerQuantityByLevel(customerCollection);
        const top3Customers = await getTop3Customers(customerCollection);

        const reportCollections = await db.collection("reportes");

        await reportCollections.insertOne( 
            {  
                anio: year,
                mes: month,
                cantidadClientes: customerQuantity,
                puntajePromedio: averageScore,
                clienteCantidadPorNivel: customerQuantityByLevel,
                Top3Clientes: top3Customers
            }     
        );

    }catch(err){
        console.log(err)
    }finally{
        client.close();
    }
}

const getCurrentMonth = () => {
    const today = new Date();
    const monthNumber = today.getMonth() == 0 ? 12 : today.getMonth();
    
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
                    "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    const month = months[monthNumber - 1];

    return month;
}

const getCurrentYear = () => {
    const today = new Date();
    const year = today.getMonth() == 0 ? today.getFullYear() - 1 : today.getFullYear();

    return year;
}

const getCustomerQuantity = async (customerCollection) => {
    const customerQuantity = await customerCollection.countDocuments({Status:"Enabled"});

    return customerQuantity;
}

const getAverageScore = async (customerCollection) => {
    const average =  await customerCollection.aggregate([{$match:{Status:"Enabled"}},{$group:{ _id: "_id",averageCredScore: { $avg: "$CreditScore" }}}]).toArray();
    
    return average[0].averageCredScore;
}

const getCustomerQuantityByLevel = async (customerCollection) => {
   
    const customerCount = await customerCollection.aggregate([
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
   
  

      let levels = {
            buenos: customerCount[0].buenos ? customerCount[0].buenos : 0,
            regulares:customerCount[0].regulares ? customerCount[0].regulares : 0,
            malos:customerCount[0].malos ? customerCount[0].malos : 0,
      }


    return levels;
}

const getTop3Customers = async (customerCollection) => {
    
    
    const clientes = await customerCollection.find({Status:"Enabled"},{"FirstName": 1,"MiddleName":1,"LastName":1,"CreditScore":1, "_id":0}).sort({"CreditScore":-1}).limit(3).toArray();
    let resultado = []

    clientes.forEach(cliente => {
        let secondName = cliente.MiddleName == "" ? "" : " " + cliente.MiddleName;
        resultado.push({nombre:cliente.FirstName + secondName + " " + cliente.LastName,scores:cliente.CreditScore});
    })

    
    return resultado;
    
    
}


module.exports = {
    queryReports:queryReports,
    saveReport:saveReport,
    getCurrentMonth:getCurrentMonth,
    getCurrentYear:getCurrentYear
}