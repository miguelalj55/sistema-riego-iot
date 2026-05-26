#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"
#include "secrets.h" //es donde tengo mis contraseñas de red y wifi

//--configuracion del sensor--
#define DHTPIN 4
#define DHTTYPE DHT11
#define LED_RIEGO 2
DHT dht(DHTPIN, DHTTYPE);

// --- Configuración Wi-Fi ---
//const char* ssid = SSID_CASA;
//const char* password = PASS_CASA;
// red movil
const char* ssid = SSID_CELULAR;
const char* password = PASS_CELULAR;


// --- Configuración MQTT ---
const char* mqtt_server = "broker.hivemq.com";
const char* topic_datos = "proyecto_iot/riego/datos";
const char* topic_comando = "proyecto_iot/riego/comando"; // NUEVO: Tópico para recibir

WiFiClient espClient;
PubSubClient client(espClient);

float tempMaxima = 28.0;
float histéresis = 1.0;  //  Histeresis o intervalo de variacion de la temperatura
unsigned long tiempoInicioRiego = 0;
const long tiempoMinimoRiego = 5000; 
bool riegoActivo = false;
bool forzadoManual = false; //  Para saber si el usuario dio una orden

//FUNCIÓN: Callback (El contestador automático)
void callback(char* topic, byte* payload, unsigned int length) {
  String mensaje = "";
  for (int i = 0; i < length; i++) {
    mensaje += (char)payload[i];
  }
  
  Serial.print("Comando recibido: "); Serial.println(mensaje);

  if (mensaje == "1") {
    forzadoManual = true;
    digitalWrite(LED_RIEGO, HIGH);
    riegoActivo = true;
    tiempoInicioRiego = millis(); // Reiniciamos tiempo por seguridad
  } else if (mensaje == "0") {
    forzadoManual = false;
    digitalWrite(LED_RIEGO, LOW);
    riegoActivo = false;
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback); //se enlaza el callback
  pinMode(LED_RIEGO, OUTPUT);
  Serial.println("Sistema de Riego IoT - Iniciado");
}

void setup_wifi() {
  delay(10);
  Serial.println("Conectando a WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" WiFi conectado");
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Intentando conexión MQTT...");
    if (client.connect("ESP32_Riego_Client")) {
      Serial.println("conectado");
      client.subscribe(topic_comando); // Suscribirse al canal de órdenes
    } else {
      Serial.print("falló, rc=");
      Serial.print(client.state());
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  static unsigned long ultimaLectura = 0;
  if (millis() - ultimaLectura > 2000) {
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    
    if (!isnan(t) && !isnan(h)) {
      // Solo ejecutamos lógica automática si NO está en modo manual
      if (!forzadoManual) {
          controlLogicaRiego(t);
      }

      String payload = "{\"temperatura\":" + String(t) + ",\"humedad\":" + String(h) + ",\"bomba\":" + String(riegoActivo) + "}";
      client.publish(topic_datos, (char*) payload.c_str());
      Serial.println("Datos enviados: " + payload);
    }
    ultimaLectura = millis();
  }
}

void controlLogicaRiego(float t) {
  unsigned long tiempoActual = millis();

  if (t > tempMaxima && !riegoActivo) {
    digitalWrite(LED_RIEGO, HIGH);
    riegoActivo = true;
    tiempoInicioRiego = tiempoActual;
    Serial.println(">>> Riego AUTOMÁTICO ACTIVADO.");
  } 
  else if (t < (tempMaxima - histéresis) && riegoActivo) {
    if (tiempoActual - tiempoInicioRiego >= tiempoMinimoRiego) {
      digitalWrite(LED_RIEGO, LOW);
      riegoActivo = false;
      Serial.println("<<< Riego AUTOMÁTICO APAGADO.");
    }
  }
}