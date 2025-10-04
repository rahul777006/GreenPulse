import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-weather',
  templateUrl: './weather.page.html',
  styleUrls: ['./weather.page.scss'],
  standalone: false
})
export class WeatherPage implements OnInit {
  currentWeather: any = {};
  forecast: any[] = [];
  slideOpts = {
    slidesPerView: 3,
    spaceBetween: 10,
  };
  private apiKey = '092da255c926d1be68e8c912b7d68745';
  city = localStorage.getItem('city')+', '+localStorage.getItem('state');

  loadingCurrent = true;
  loadingForecast = true;
  errorCurrent = false;
  errorForecast = false;
  alertMessage = '';
  alertType = ''; // 'warning' or 'good'

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getCurrentWeather();
    this.getForecast();
  }

  getCurrentWeather() {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${this.city}&appid=${this.apiKey}&units=metric`;
    this.http.get(url).subscribe({
      next: (data: any) => {
        console.log('Current weather data:', data);
        this.currentWeather = data;
        this.loadingCurrent = false;
        this.setAlert();
      },
      error: (error) => {
        console.error('Error fetching current weather:', error);
        this.loadingCurrent = false;
        this.errorCurrent = true;
      }
    });
  }

  getForecast() {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${this.city}&appid=${this.apiKey}&units=metric`;
    this.http.get(url).subscribe({
      next: (data: any) => {
        console.log('Forecast data:', data);
        this.forecast = data.list.slice(0, 6).map((item: any) => ({
          time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          temp: Math.round(item.main.temp),
          icon: this.getIcon(item.weather[0].main)
        }));
        this.loadingForecast = false;
      },
      error: (error) => {
        console.error('Error fetching forecast:', error);
        this.loadingForecast = false;
        this.errorForecast = true;
      }
    });
  }

  getIcon(weather: string | null | undefined): string {
    if (!weather) return 'partly-sunny-outline';
    switch (weather.toLowerCase()) {
      case 'clear': return 'sunny-outline';
      case 'clouds': return 'cloud-outline';
      case 'rain': return 'rainy-outline';
      case 'snow': return 'snow-outline';
      case 'thunderstorm': return 'thunderstorm-outline';
      default: return 'partly-sunny-outline';
    }
  }

  setAlert() {
    const main = this.currentWeather.weather?.[0]?.main;
    if (main === 'Rain') {
      this.alertType = 'warning';
      this.alertMessage = 'Heavy rain expected. Take precautions for crops.';
    } else if (main === 'Clear') {
      this.alertType = 'good';
      this.alertMessage = 'Good weather today! Perfect for farming.';
    } else if (main === 'Snow') {
      this.alertType = 'warning';
      this.alertMessage = 'Snow expected. Protect crops from cold.';
    } else if (main === 'Thunderstorm') {
      this.alertType = 'warning';
      this.alertMessage = 'Thunderstorm alert. Secure outdoor equipment.';
    } else {
      this.alertType = 'neutral';
      this.alertMessage = 'Weather is moderate. Monitor conditions.';
    }
  }

  getCurrentDate(): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return now.toLocaleDateString('en-US', options);
  }

  getAlertTitle(): string {
    switch (this.alertType) {
      case 'warning': return 'Weather Alert';
      case 'good': return 'Perfect Conditions';
      case 'neutral': return 'Weather Update';
      default: return 'Weather Info';
    }
  }

  getWindDirection(degrees: number): string {
    if (!degrees) return 'N/A';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  trackByFn(index: number, item: any): any {
    return index;
  }
}