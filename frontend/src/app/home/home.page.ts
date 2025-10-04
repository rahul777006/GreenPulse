import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ModalController, AlertController, ToastController, LoadingController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CropsService } from '../services/crops.service';
import { Server } from '../services/server';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss','./home-2.page.scss','./home-3.page.scss','./home-4.page.scss'],
  standalone:false
})
export class HomePage implements OnInit {

  points = 2350;

  user_name = localStorage.getItem('user_name');
  phone = localStorage.getItem('phone');
  state = localStorage.getItem('state');
  degrees = "34";
  private apiKey = '092da255c926d1be68e8c912b7d68745';
  city = localStorage.getItem('city')+', '+localStorage.getItem('state');
  currentWeather:any = '';

  // Stats data
  totalCrops = 150;
  totalFarmers = 2500;
  yieldIncrease = 25;

  // Reminders data
  reminders = [
    {
      title: 'Water Your Crops',
      message: 'Evening watering recommended for wheat fields',
      time: '6:00 PM',
      icon: 'water-outline',
      priority: 'high'
    },
    {
      title: 'Fertilizer Application',
      message: 'Apply nitrogen fertilizer to rice fields',
      time: 'Tomorrow',
      icon: 'flask-outline',
      priority: 'medium'
    },
    {
      title: 'Weather Alert',
      message: 'Rain expected in 2 days, plan accordingly',
      time: 'Oct 6',
      icon: 'rainy-outline',
      priority: 'high'
    },
    {
      title: 'Market Day',
      message: 'Best prices for wheat at Mandi today',
      time: 'Today',
      icon: 'storefront-outline',
      priority: 'low'
    }
  ];

  // Grain prices data
  grainPrices = [
    {
      name: 'Wheat',
      currentPrice: 2250,
      change: 2.5,
      unit: 'quintal',
      market: 'Ludhiana Mandi',
      image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop'
    },
    {
      name: 'Rice',
      currentPrice: 3100,
      change: -1.2,
      unit: 'quintal',
      market: 'Amritsar Mandi',
      image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&h=300&fit=crop'
    },
    {
      name: 'Corn',
      currentPrice: 1850,
      change: 4.8,
      unit: 'quintal',
      market: 'Bathinda Mandi',
      image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop'
    },
    {
      name: 'Sugarcane',
      currentPrice: 350,
      change: 1.5,
      unit: 'quintal',
      market: 'Jalandhar Mandi',
      image: 'https://agritimes.co.in/assets/images/the-sweet-and-sour-tale-of-sugarcane-crop-in-india-english.jpeg'
    },
    {
      name: 'Cotton',
      currentPrice: 6200,
      change: -2.1,
      unit: 'quintal',
      market: 'Fazilka Mandi',
      image: 'https://static.vecteezy.com/system/resources/thumbnails/046/349/194/small_2x/calming-ready-to-harvest-cotton-landscapes-for-web-use-free-photo.jpeg'
    },
    {
      name: 'Mustard',
      currentPrice: 5450,
      change: 3.2,
      unit: 'quintal',
      market: 'Patiala Mandi',
      image: 'https://media.istockphoto.com/id/1135682778/photo/bright-yellow-field-of-canola.jpg?s=612x612&w=0&k=20&c=aBf8MV0BM_ev66ZXswYKYI0FJ_qTpBb2_DjcFQN-JLs='
    }
  ];

  // User crops data
  userCrops: any[] = [];
  userId = localStorage.getItem('user_id') || localStorage.getItem('phone');

  // Crop options
  cropOptions = [
    'Wheat', 'Rice', 'Corn', 'Sugarcane', 'Cotton', 'Mustard', 'Soybean',
    'Barley', 'Potato', 'Tomato', 'Onion', 'Garlic', 'Chili', 'Turmeric'
  ];

  constructor(
    private http: HttpClient,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private formBuilder: FormBuilder,
    private cropsService: CropsService,
    private server: Server
  ) {
    this.getCurrentWeather();
    this.loadUserCrops();
   }

  ngOnInit() {

  }

  getTimeGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  }

  // Load user's crops from API
  async loadUserCrops() {
    if (!this.userId) return;

    try {
      const response = await this.server.getUserCrops(this.userId).toPromise();
      if (response && response.data) {
        // Ensure each crop has an image from Unsplash
        this.userCrops = response.data.map((crop: any) => ({
          ...crop,
          image: crop.image || this.cropsService.getCropImageFromUnsplash(crop.cropName)
        }));
      } else {
        this.userCrops = [];
      }
    } catch (error) {
      console.error('Error loading crops:', error);
      // For demo purposes, use mock data with proper Unsplash images
      this.userCrops = [
        {
          id: 1,
          cropName: 'Wheat',
          fieldName: 'North Field',
          fieldSize: 5.2,
          plantingDate: '2024-11-15',
          status: 'Growing',
          image: this.cropsService.getCropImageFromUnsplash('Wheat')
        },
        {
          id: 2,
          cropName: 'Rice',
          fieldName: 'South Field',
          fieldSize: 3.8,
          plantingDate: '2024-12-01',
          status: 'Planted',
          image: this.cropsService.getCropImageFromUnsplash('Rice')
        }
      ];
    }
  }

  // Open add crop modal
  async openAddCropModal() {
    const alert = await this.alertController.create({
      header: 'Add New Crop',
      message: 'Enter details for your new crop',
      inputs: [
        {
          name: 'cropName',
          type: 'text',
          placeholder: 'Crop Name (e.g., Wheat)',
          attributes: {
            list: 'crop-options'
          }
        },
        {
          name: 'fieldName',
          type: 'text',
          placeholder: 'Field Name (e.g., North Field)'
        },
        {
          name: 'fieldSize',
          type: 'number',
          placeholder: 'Field Size (acres)',
          min: 0.1
            },

        {
          name: 'plantingDate',
          type: 'date',
          value: new Date().toISOString().split('T')[0]
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Add Crop',
          handler: (data) => {
            if (data.cropName && data.fieldName && data.fieldSize && data.plantingDate) {
              this.addCrop(data);
              return true;
            } else {
              this.showToast('Please fill all fields', 'warning');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Add crop to API
  async addCrop(cropData: any) {
    const loading = await this.loadingController.create({
      message: 'Adding crop...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const payload = {
        userId: this.userId,
        cropName: cropData.cropName,
        fieldName: cropData.fieldName,
        fieldSize: parseFloat(cropData.fieldSize),
        plantingDate: cropData.plantingDate,
        status: 'Planted',
        image: this.cropsService.getCropImageFromUnsplash(cropData.cropName)
      };

      // API call to add crop using server service
      const response = await this.server.addCrop(payload).toPromise();
      
      if (response && response.success) {
        // Add the new crop to local array with server response data
        const newCrop = {
          id: response.data?.id || Date.now(),
          ...payload
        };
        this.userCrops.unshift(newCrop);
        await this.showToast('Crop added successfully!', 'success');
      } else {
        // Fallback: add to local array for demo purposes
        const newCrop = {
          id: Date.now(),
          ...payload
        };
        this.userCrops.unshift(newCrop);
        await this.showToast('Crop added successfully!', 'success');
      }
    } catch (error) {
      console.error('Error adding crop:', error);
      // Still add to local array as fallback
      const newCrop = {
        id: Date.now(),
        userId: this.userId,
        cropName: cropData.cropName,
        fieldName: cropData.fieldName,
        fieldSize: parseFloat(cropData.fieldSize),
        plantingDate: cropData.plantingDate,
        status: 'Planted',
        image: this.cropsService.getCropImageFromUnsplash(cropData.cropName)
      };
      this.userCrops.unshift(newCrop);
      await this.showToast('Crop added (offline mode)', 'warning');
    } finally {
      await loading.dismiss();
    }
  }

  // Get crop image based on crop name (using crops service)
  getCropImage(cropName: string): string {
    return this.cropsService.getCropImageFromUnsplash(cropName);
  }

  // View all crops
  async viewAllCrops() {
    const alert = await this.alertController.create({
      header: 'All My Crops',
      message: `You have ${this.userCrops.length} crops registered.`,
      buttons: [
        {
          text: 'Add More',
          handler: () => {
            this.openAddCropModal();
          }
        },
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Get status icon
  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'planted':
        return 'seed-outline';
      case 'growing':
        return 'leaf-outline';
      case 'flowering':
        return 'flower-outline';
      case 'harvested':
        return 'checkmark-circle-outline';
      default:
        return 'ellipse-outline';
    }
  }

  // Delete crop
  async deleteCrop(cropId: string) {
    const alert = await this.alertController.create({
      header: 'Delete Crop',
      message: 'Are you sure you want to delete this crop?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Deleting crop...',
              spinner: 'crescent'
            });
            await loading.present();

            try {
              await this.server.deleteCrop(cropId).toPromise();
              this.userCrops = this.userCrops.filter(crop => crop.id !== cropId);
              await this.showToast('Crop deleted successfully!', 'success');
            } catch (error) {
              console.error('Error deleting crop:', error);
              // Still remove from local array as fallback
              this.userCrops = this.userCrops.filter(crop => crop.id !== cropId);
              await this.showToast('Crop deleted (offline mode)', 'warning');
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // Show toast message
  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }

  getCurrentWeather() {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${this.city}&appid=${this.apiKey}&units=metric`;
    this.http.get(url).subscribe({
      next: (data: any) => {
        console.log('Current weather data:', data);
        this.currentWeather = data;
      },
      error: (error) => {
        console.error('Error fetching current weather:', error);
      }
    });
  }

}
