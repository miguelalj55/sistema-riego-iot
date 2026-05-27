# 🍄 Sistema Automatizado de Riego IoT con Control Manual en Tiempo Real

¡Bienvenido! Este es un proyecto **Full-Stack IoT** diseñado para automatizar y monitorear de forma remota el riego en cultivos (en este caso, cultivo de champiñoes). El sistema integra la lectura de variables físicas en tiempo real, el almacenamiento de datos históricos y un panel de control interactivo que permite la convivencia segura entre una lógica automática por hardware y comandos manuales del usuario.

## 🚀 Características Principales
* **Monitoreo en Tiempo Real:** Lectura de temperatura y humedad relativa a través de un sensor DHT11 y un microcontrolador ESP32.
* **Control de Convivencia (Híbrido):** Lógica automática basada en histéresis para proteger la bomba de agua de parpadeos constantes, con anulación (overriding) manual prioritaria desde la web.
* **Arquitectura Push (Event-Driven):** Comunicación bidireccional instantánea mediante el protocolo **MQTT** con separación de canales (`/datos` y `/comando`), reduciendo la latencia y el consumo de ancho de banda casi a cero comparado con HTTP tradicional.
* **Persistencia de Datos:** Base de datos NoSQL para registrar el histórico de lecturas  del ambiente.
* **Dashboard Web Interactivo:** Gráficas dinámicas renderizadas en tiempo real en el frontend.

---

## 🛠️ Stack Tecnológico

### Hardware & Firmware
* **Microcontrolador:** ESP32 (NodeMCU).
* **Sensores:** DHT11 (Temperatura y Humedad Relativa).
* **Actuadores:** Relé de 5V para control de motobomba.
* **Entorno:** Arduino IDE (C++).

### Backend
* **Entorno de ejecución:** Node.js con Express.
* **Base de Datos:** MongoDB Atlas (Mongoose ORM).
* **Protocolo de Comunicación:** MQTT (Librería `mqtt.js` en Node y `PubSubClient` en ESP32).
* **Broker:** HiveMQ (Público).

### Frontend
* **Estructura y Estilos:** HTML5, CSS3 (Estructuras Flexbox/Grid).
* **Lógica de Cliente:** JavaScript Vanilla.
* **Visualización:** Chart.js (Gráficas dinámicas de líneas).

---

## 📐 Arquitectura del Sistema

```text
[Sensor DHT11]--(Lectura)->[ESP32(C++) ]<==(MQTT Broker)==>[Servidor Node.js] --> [ MongoDB Atlas ]
                             ||                                          ^
                          (Control)                                      |
                             ||                                        (HTTP)
                             \/                                          |
                       [ Motobomba ] <============================= [ Dashboar Web ]