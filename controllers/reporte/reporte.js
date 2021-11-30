const { MongoClient } = require('mongodb');

const getReports = async (res)=>{

    const reportes = await Reports()

    if(!reportes){
        return res.status(404).json({message:"No hay reportes"});
    }

    return res.status(200).json({reportes});


}

const Reports = async ()=>{
    
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

module.exports = {
    getReports:getReports
}