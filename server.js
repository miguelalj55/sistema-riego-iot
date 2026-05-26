
require('dotenv').config();
const mqtt = require('mqtt');
const express = require('express');
const mongoose = require('mongoose'); 
const cors = require ('cors');




const app = express();
app.use(cors())
app.use(express.json())

//lee el archivo .env, si no encuentra nada, usa el 3000 por defecto
const PORT = process.env.PORT || 3000;



// --- CONEXIÓN A MONGODB ---

const dbURI = process.env.MONGODB_URI;

mongoose.connect(dbURI, {
    serverSelectionTimeoutMS: 5000 // Si no conecta en 5 segundos, nos avisa
})
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch((err) => {
    console.error('❌ ERROR DETALLADO:', err.message);
    console.error('❌ CÓDIGO DE ERROR:', err.name);
  });

// 2. DEFINIMOS EL MODELO DE DATOS (El "molde")
const lecturaSchema = new mongoose.Schema({
    temperatura: Number,
    humedad: Number,
    bomba: Boolean,
    fecha: { type: Date, default: Date.now }
});
const Lectura = mongoose.model('Lectura', lecturaSchema);

// --- CONFIGURACIÓN DEL BROKER MQTT ---
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const brokerUrl = 'mqtt://broker.hivemq.com'; 

const client = mqtt.connect(brokerUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
});

const topic = 'proyecto_iot/riego/datos';

client.on('connect', () => {
    console.log('✅ Conectado al Broker MQTT');
    client.subscribe([topic], () => {
        console.log(`Subscrito al tópico: ${topic}`);
    });
});

// --- RECEPCIÓN Y GUARDADO DE MIS DATOS ---
client.on('message', (topic, payload) => {
    try {
        const data = JSON.parse(payload.toString());
        
        console.log('--- Nuevo Dato Recibido ---');
        console.log(`Temp: ${data.temperatura}°C, Hum: ${data.humedad}%, Bomba: ${data.bomba}`);
        
        // AQUÍ GUARDAMOS EN MONGODB
        const nuevaLectura = new Lectura({
            temperatura: data.temperatura,
            humedad: data.humedad,
            bomba: data.bomba
        });

        nuevaLectura.save()
            .then(() => console.log('💾 Dato guardado exitosamente en MongoDB'))
            .catch(err => console.error('❌ Error al guardar:', err));
            
    } catch (e) {
        console.log('Error al procesar el JSON:', e.message);
    }
});

app.get('/', (req, res) => {
    res.send('Servidor de Monitoreo de Riego Activo y conectado a DB');
});

// --- ENDPOINT PARA CONSULTAR DATOS ---
app.get('/datos', async (req, res) => {
    try {
        // Buscamos en la colección Lecturas
        // .sort({ fecha: -1 }) => Ordena de más nuevo a más viejo
        // .limit(10) => Solo traemos los últimos 10 registros
        const ultimasLecturas = await Lectura.find().sort({ fecha: -1 }).limit(10);
        
        // Enviamos los datos al cliente en formato JSON
        res.json(ultimasLecturas);
    } catch (error) {
        console.error('Error al obtener datos:', error);
        res.status(500).json({ error: 'No se pudieron recuperar los datos' });
    }
});


app.post('/control-bomba', (req, res) => {
    const estado = req.body.estado; // true o false
    const mensaje = estado ? "1" : "0"; // Enviamos "1" para encender, "0" para apagar
    
    // Publicamos al tópic que el ESP32 estará escuchando
    client.publish('proyecto_iot/riego/comando', mensaje, (err) => {
        if (!err) {
            console.log("Comando enviado a MQTT:", mensaje);
            res.json({ success: true });
        } else {
            res.status(500).json({ success: false });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
