const { MongoClient } = require('mongodb');
const axios = require('axios');

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

const normalDate = () => {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    const currentDate = {
        day: day,
        month: month,
        year: year
    }

    return currentDate;
}

const saveDollarRate = async (tasaDolarCollection) => {
    const currentDate = normalDate();

    try {        
        
        const dollarConvertion = await getDollarRate();

        await tasaDolarCollection.insertOne( 
            {  
                dia: currentDate.day,
                mes: currentDate.month,
                anio: currentDate.year,
                dollarRate: dollarConvertion
            }     
        );

    }catch(err){
        console.log(err)
    }
}

const getDollarRate = async () => {
    const apiKey = process.env.CURRENCY_KEY;

    try {
        const response = await axios.get(`https://free.currconv.com/api/v7/convert?q=USD_DOP&compact=ultra&apiKey=${apiKey}`);
        return response.data.USD_DOP;
    } catch (err) {

        console.log(err);
    }

}

const setDollarRate = async () => {
    const client = await new MongoClient(process.env.MONGODB_SERVER);
    const dbName = process.env.DATABASE_NAME;
    const currentDate = normalDate();
    try {
        await client.connect();
        const db = client.db(dbName);
        
        const tasaDolarCollection = await db.collection("tasaDolar");

        const countDollarRate = await tasaDolarCollection.countDocuments({$and:[{dia:currentDate.day},{mes:currentDate.month},{anio:currentDate.year}]})       
       
        if(countDollarRate<1)
            await saveDollarRate(tasaDolarCollection);
        
        const currentDollarRate = await tasaDolarCollection.find({dia:currentDate.day,mes:currentDate.month,anio:currentDate.year}).toArray();

        return currentDollarRate[0].dollarRate;

    }catch(err){
        console.log(err)
    }finally{
        client.close();
    }

}


module.exports = {
    getCurrentMonth:getCurrentMonth,
    getCurrentYear:getCurrentYear,
    setDollarRate:setDollarRate,
    normalDate:normalDate
}