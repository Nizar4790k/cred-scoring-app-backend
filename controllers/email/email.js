const mailjet = require ('node-mailjet')
.connect(`${process.env.MJ_APIKEY_PUBLIC}`, `${process.env.MJ_APIKEY_PRIVATE}`)
const datos = require("../datos/datos");
const costumer = require("../customer/customer")
const { MongoClient } = require('mongodb');

const enviarEmail = (nombreCompleto, prestamoCantidad, puntajeCredito, correo) => {
    const request = mailjet
        .post("send", {'version': 'v3.1'})
        .request({
            "Messages":[
                {
                    "From": {
                        "Email": "anthonyde98@gmail.com",
                        "Name": "Banco Fihogar"
                    },
                    "To": [
                        {
                            "Email": correo,
                            "Name": nombreCompleto
                        }
                    ],
                    "TemplateID": 3439996,
                    "TemplateLanguage": true,
                    "Subject": "Préstamo pre-aprobado",
                    "Variables": {
                        "nombreCompleto": nombreCompleto,
                        "prestamoCantidad": prestamoCantidad,
                        "puntajeCredito": puntajeCredito
                    }
                }
            ]
        })
    request
        .then((result) => {
            console.log(result.body)
        })
        .catch((err) => {
            console.log(err.statusCode)
        })
}

const saveInfoEmails = async (cantidadCorreos) => {
    const client = await new MongoClient(process.env.MONGODB_SERVER);
    const dbName = process.env.DATABASE_NAME;
    const currentDate = datos.normalDate();
    try {
        await client.connect();
        const db = client.db(dbName);
        
        const emailCollection = await db.collection("correos");
        
        await emailCollection.insertOne( 
            {  
                dia: currentDate.day,
                mes: currentDate.month,
                anio: currentDate.year,
                correosEnviados: cantidadCorreos
            }     
        );

    }catch(err){
        console.log(err)
    }finally{
        client.close();
    }

}

const emails = async () => {
    const costumers = await costumer.getGoodCostumers();
    let sendEmails = 0;

    costumers.forEach(costumer => {
        //enviarEmail(costumer.nombreCompleto, costumer.prestamoCantidad, costumer.puntajeCredito, costumer.correo);
        sendEmails++;
    });
    //saveInfoEmails(sendEmails);

    console.log({costumers: costumers, emails: sendEmails});
}

module.exports = {
    emails:emails,
}