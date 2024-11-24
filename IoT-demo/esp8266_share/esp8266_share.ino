#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// WiFi và MQTT thông tin
#define SSID "1111"
#define PASSWORD "17022003"
#define MQTT_SERVER "192.168.43.184"
#define MQTT_PORT 1883

// Khai báo chân
#define REDPIN_AUTO D0  // Chân điều khiển LED đỏ tự động
#define REDPIN_MANUAL D1 // Chân điều khiển LED đỏ thủ công
#define DHTPIN D4        // Chân kết nối cảm biến DHT11
#define LDRPIN A0        // Chân kết nối quang trở

// Các thông số ngưỡng ánh sáng
#define LDR_THRESHOLD 500 // Ngưỡng ánh sáng để bật LED tự động

WiFiClient espClient;
PubSubClient mqttClient(espClient);
DHT dht(DHTPIN, DHT11);

unsigned long startDhtTime = 0; // Thời gian đọc cảm biến DHT
int manualLedState = LOW;       // Trạng thái LED đỏ thủ công

void setup()
{
  Serial.begin(115200);

  // Khởi tạo DHT11
  dht.begin();
  pinMode(REDPIN_AUTO, OUTPUT); // Cấu hình chân LED tự động làm OUTPUT
  pinMode(REDPIN_MANUAL, OUTPUT); // Cấu hình chân LED thủ công làm OUTPUT
  digitalWrite(REDPIN_AUTO, LOW); // Tắt LED tự động ban đầu
  digitalWrite(REDPIN_MANUAL, LOW); // Tắt LED thủ công ban đầu

  // Kết nối WiFi
  WiFi.begin(SSID, PASSWORD);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected: " + WiFi.localIP().toString());

  // Cấu hình MQTT
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  while (!mqttClient.connected())
  {
    if (mqttClient.connect("esp8266"))
    {
      Serial.println("MQTT Connected");
      mqttClient.subscribe("button"); // Đăng ký nhận thông điệp từ topic "button"
    }
    else
    {
      Serial.println("Retry MQTT connection...");
      delay(1000);
    }
  }

  mqttClient.setCallback(sub_data); // Hàm callback xử lý dữ liệu nhận
}

// Hàm xử lý dữ liệu từ MQTT
void sub_data(char *topic, byte *payload, unsigned int length)
{
  if (strcmp(topic, "button") == 0)
  {
    String s = "";
    for (int i = 0; i < length; i++)
      s += (char)payload[i];
    if (s.equalsIgnoreCase("led|on"))
    {
      manualLedState = HIGH; // Bật LED đỏ thủ công
    }
    if (s.equalsIgnoreCase("led|off"))
    {
      manualLedState = LOW; // Tắt LED đỏ thủ công
    }
    digitalWrite(REDPIN_MANUAL, manualLedState); // Cập nhật trạng thái LED đỏ thủ công
    Serial.println("Manual LED State: " + String(manualLedState ? "ON" : "OFF"));
    mqttClient.publish("action", ("Manual LED is " + String(manualLedState ? "ON" : "OFF")).c_str());
  }
}

// Hàm đọc dữ liệu cảm biến ánh sáng
int readAnalog(int pin)
{
  return analogRead(pin); // Đọc giá trị từ chân analog
}

void loop()
{
  unsigned long currentMillis = millis();

  if (mqttClient.connected())
  {
    mqttClient.loop();

    // Đọc cảm biến nhiệt độ, độ ẩm và ánh sáng mỗi 2 giây
    if (currentMillis - startDhtTime >= 2000)
    {
      startDhtTime = currentMillis;

      // Đọc nhiệt độ, độ ẩm từ DHT11
      float temp = dht.readTemperature();
      float humi = dht.readHumidity();

      // Đọc cảm biến ánh sáng từ chân LDR
      int light = readAnalog(LDRPIN);



      // Điều khiển LED tự động dựa vào ánh sáng
      if (light < LDR_THRESHOLD)
      {
        digitalWrite(REDPIN_AUTO, HIGH); // Bậ  t LED tự động nếu ánh sáng yếu
      }
      else
      {
        digitalWrite(REDPIN_AUTO, LOW);  // Tắt LED tự động nếu ánh sáng đủ
      }

      // Xuất dữ liệu ra Serial và gửi lên MQTT
      String data = "DHT11|" + String(temp) + "|" + String(humi) + "|" + String(light);
      Serial.println(data);
      mqttClient.publish("sensor", data.c_str());

      if (temp > 3132) {
        // Ser
        mqttClient.publish("canh_bao", data.c_str());
      }
    }
  }
}
