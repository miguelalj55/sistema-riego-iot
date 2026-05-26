console.log("El script se cargó correctamente");

let miGrafica;
let estadoBombaActual = false;
const maxDatos = 10; 
let etiquetas = [];
let datosTemperatura = [];

async function obtenerDatos() {
    try {
        const respuesta = await fetch('http://localhost:3000/datos')
        const datos = await respuesta.json()

        if (datos.length > 0){
            const ultimoDato = datos [0]

            document.getElementById('valor-temperatura').innerText = ultimoDato.temperatura + "°C"
            document.getElementById('valor-humedad').innerText = ultimoDato.humedad + "%"
            document.getElementById('valor-bomba').innerText = ultimoDato.bomba ? "Encendida" : "Apagada"
       
            // --- Actualizar datos de la gráfica ---
            const ahora = new Date().toLocaleTimeString();
            
            if (etiquetas.length >= maxDatos) {
                etiquetas.shift(); // Quita el dato más viejo
                datosTemperatura.shift();
            }
            
            etiquetas.push(ahora);
            datosTemperatura.push(ultimoDato.temperatura);

            if (miGrafica) {
                miGrafica.update(); // Redibuja la gráfica con el nuevo punto
            }
        }


    } catch (error){
        console.error("error al conectar con el server"), error
    }
}

obtenerDatos()
setInterval(obtenerDatos,2000)

function crearGrafica() {
    const ctx = document.getElementById('miGrafica').getContext('2d');
    miGrafica = new Chart(ctx, {
        type: 'line',
        data: {
            labels: etiquetas,
            datasets: [{
                label: 'Temperatura °C',
                data: datosTemperatura,
                borderColor: '#00e676',
                backgroundColor: 'rgba(0, 230, 118, 0.2)',
                fill: true,
                tension: 0.4 // Hace que la línea sea curva
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: false, grid: { color: '#333' } },
                x: { grid: { color: '#333' } }
            }
        }
    });
}

//  Lógica del Botnn para mostrar/ocultar
document.getElementById('btn-grafica').addEventListener('click', function() {
    const contenedor = document.getElementById('contenedor-grafica');
    contenedor.classList.toggle('oculto'); // Quita o pone la clase 'oculto'
    
    if (!contenedor.classList.contains('oculto') && !miGrafica) {
        crearGrafica(); // Crea la gráfica la primera vez que se abre
    }
    
    this.innerText = contenedor.classList.contains('oculto') 
        ? "Ver Gráfica en Tiempo Real" 
        : "Ocultar Gráfica";
});




async function cambioEstadoBomba() {
    // Invertimos el estado actual
    const nuevoEstado = !estadoBombaActual;
    
    try {
        const respuesta = await fetch('http://localhost:3000/control-bomba', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (respuesta.ok) {
            estadoBombaActual = nuevoEstado; // mi variable global
            actualizarInterfazBomba();
        }
    } catch (error) {
        console.error("Error al controlar la bomba:", error);
    }
}

function actualizarInterfazBomba() {
    const btnBomba = document.getElementById('btn-bomba');
    btnBomba.innerText = estadoBombaActual ? "APAGAR BOMBA" : "ENCENDER BOMBA";
    btnBomba.style.backgroundColor = estadoBombaActual ? "#ff5252" : "#00e676";
}