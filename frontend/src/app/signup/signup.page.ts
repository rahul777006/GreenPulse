/*
 * GOOGLE MAPS API SETUP INSTRUCTIONS:
 * 
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select existing project
 * 3. Enable the Geocoding API
 * 4. Create credentials (API Key)
 * 5. Replace 'YOUR_GOOGLE_MAPS_API_KEY' in environment.ts and environment.prod.ts
 * 6. Optionally restrict the API key to specific APIs and domains for security
 */

import { Component, OnInit } from '@angular/core';
import { Server } from '../services/server';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: false
})
export class SignupPage implements OnInit {

  signupForm: FormGroup;
  isSubmitting = false;
  latitude: number | null = null;
  longitude: number | null = null;
  // Google Maps API Key from environment
  private GOOGLE_MAPS_API_KEY = "AIzaSyCqucjLfdHlLZrGOHNqBcDhKlqY37WdE3I";

  // Array of Indian states
  indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];


  constructor(
    private serverService: Server,
    private formBuilder: FormBuilder,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private router: Router,
    private http: HttpClient
  ) {
    this.signupForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[6-9]\\d{9}$')]],
      state: ['', [Validators.required]],
      city: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit() {
    this.checkLocationPermissionStatus();
  }

  async checkLocationPermissionStatus() {
    try {
      const permissions = await Geolocation.checkPermissions();
      console.log('Location permission status:', permissions.location);
      
      // You can use this information to show/hide location button or show hints to user
      if (permissions.location === 'granted') {
        console.log('Location permission already granted');
        // Also check if location services are enabled
        await this.checkLocationServices();
      } else if (permissions.location === 'denied') {
        console.log('Location permission denied');
      } else {
        console.log('Location permission not determined');
      }
    } catch (error) {
      console.error('Error checking location permissions:', error);
    }
  }

  private async checkLocationServices() {
    try {
      // Try a quick location check to see if services are available
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 3000,
        maximumAge: 300000 // 5 minutes cache
      });
      console.log('Location services are working:', position.coords);
    } catch (error: any) {
      console.log('Location services check failed:', error);
      if (error?.code === 2) {
        console.warn('GPS/Location services might be disabled on this device');
      }
    }
  }

  async submitSignupForm() {
    if (this.signupForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const loading = await this.loadingController.create({
        message: 'Creating account...',
        spinner: 'crescent'
      });
      await loading.present();

      const dataToSend = {
        name: this.signupForm.get('fullName')?.value,
        phone: this.signupForm.get('phoneNumber')?.value,
        state: this.signupForm.get('state')?.value,
        city: this.signupForm.get('city')?.value,
        latitude: this.latitude,
        longitude: this.longitude
      };

      this.serverService.signup(dataToSend).subscribe({
        next: async (response: any) => {

          if(response.user_id){
            localStorage.setItem('user_id',response.user_id)
          }

          localStorage.setItem('user_name',dataToSend.name)
          localStorage.setItem('phone',dataToSend.phone)
          localStorage.setItem('state',dataToSend.state)
          localStorage.setItem('city',dataToSend.city)

          console.log('Signup successful:', response);
          await loading.dismiss();
          this.isSubmitting = false;
          


          await this.showToast('Account created successfully!', 'success');
          // Navigate to home or login page
          this.router.navigate(['/home']);
        },
        error: async (error: any) => {
          console.error('Signup error:', error);
          await loading.dismiss();
          this.isSubmitting = false;
          
          let errorMessage = 'Failed to create account. Please try again.';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          
          await this.showToast(errorMessage, 'danger');
        },
      });
    } else {
      await this.showValidationErrors();
    }
  }

  async getLocation() {
    // Check if Google Maps API key is configured
    if (!this.GOOGLE_MAPS_API_KEY || this.GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
      await this.showToast('Google Maps API key not configured. Please contact administrator.', 'danger');
      return;
    }

    // Handle location permissions
    const hasPermission = await this.handleLocationPermission();
    if (!hasPermission) {
      return;
    }

    // Try to get location with fallback
    await this.attemptLocationRetrieval();
  }

  private async attemptLocationRetrieval(retryCount: number = 0) {
    const maxRetries = 2;

    // Show loading indicator with retry info
    const loading = await this.loadingController.create({
      message: retryCount > 0 ? `Retrying location... (${retryCount + 1}/${maxRetries + 1})` : 'Getting your location...',
      spinner: 'crescent'
    });
    await loading.present();

    // Log attempt for debugging
    console.log(`Location attempt ${retryCount + 1}/${maxRetries + 1}`);

    try {
      // Progressive settings - start with high accuracy, fallback to faster settings
      const locationOptions = {
        enableHighAccuracy: retryCount === 0, // High accuracy on first try, then lower
        timeout: retryCount === 0 ? 20000 : 10000, // Shorter timeout on retries
        maximumAge: retryCount === 0 ? 30000 : 60000 // Allow older cache on retries
      };
      
      console.log('Using location options:', locationOptions);
      
      // Get current position using Capacitor's native geolocation
      const position = await Geolocation.getCurrentPosition(locationOptions);
      
      console.log('Location obtained:', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      });

      // Update loading message
      loading.message = 'Finding your city and state...';

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      // Store coordinates for form submission
      this.latitude = latitude;
      this.longitude = longitude;

      // Call Google Maps Reverse Geocoding API
      const locationData = await this.reverseGeocode(latitude, longitude);

      if (locationData) {
        // Auto-fill the form fields
        this.signupForm.patchValue({
          city: locationData.city,
          state: locationData.state
        });

        await loading.dismiss();
        await this.showToast(`Location detected: ${locationData.city}, ${locationData.state}`, 'success');
      } else {
        await loading.dismiss();
        await this.showToast('Could not determine city and state from your location.', 'warning');
      }

    } catch (positionError: any) {
      await loading.dismiss();
      console.error('Position error:', positionError);
      
      let errorMessage = 'Unable to get location. Please enter manually.';
      
      // Handle different types of geolocation errors
      if (positionError?.code) {
        switch (positionError.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'Location access denied. Please enable location permissions in your device settings.';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = 'Location services are not available. Please check your device settings.';
            break;
          case 3: // TIMEOUT
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = 'Unable to get location. Please enter manually.';
        }
      } else if (positionError?.message) {
        if (positionError.message.includes('location unavailable') || positionError.message.includes('not available')) {
          errorMessage = 'Location services are not available. Please check your device settings.';
        } else if (positionError.message.includes('timeout')) {
          errorMessage = 'Location request timed out. Please try again.';
        } else if (positionError.message.includes('denied') || positionError.message.includes('permission')) {
          errorMessage = 'Location access denied. Please enable location permissions in your device settings.';
        }
      }
      
      // Add debugging information in development
      console.log('Location error details:', {
        code: positionError?.code,
        message: positionError?.message,
        stack: positionError?.stack
      });
      
      // Try retry logic before showing final error
      if (retryCount < maxRetries && this.shouldRetryLocation(positionError)) {
        console.log(`Retrying location request in 2 seconds... (attempt ${retryCount + 2})`);
        setTimeout(() => {
          this.attemptLocationRetrieval(retryCount + 1);
        }, 2000);
        return;
      }
      
      await this.showToast(errorMessage, 'warning');
      
      // Offer retry option for timeout errors after all retries failed
      if (positionError?.code === 3 || positionError?.message?.includes('timeout')) {
        await this.showRetryLocationAlert();
      }
    }
  }

  private shouldRetryLocation(error: any): boolean {
    // Don't retry for permission denied errors
    if (error?.code === 1) return false;
    
    // Retry for timeout and position unavailable errors
    return error?.code === 2 || error?.code === 3 || 
           error?.message?.includes('timeout') || 
           error?.message?.includes('unavailable');
  }

  async showRetryLocationAlert() {
    const alert = await this.alertController.create({
      header: 'Location Timeout',
      message: 'Getting your location took too long. Would you like to try again?',
      buttons: [
        {
          text: 'Enter Manually',
          role: 'cancel',
          handler: () => {
            console.log('User chose to enter location manually after timeout');
          }
        },
        {
          text: 'Try Again',
          handler: () => {
            this.getLocation();
          }
        }
      ]
    });
    await alert.present();
  }

  async showLocationPermissionAlert() {
    const alert = await this.alertController.create({
      header: 'Location Permission Required',
      message: 'This app needs location access to automatically detect your city and state for a better farming experience. You can also enter your location manually.',
      buttons: [
        {
          text: 'Enter Manually',
          role: 'cancel',
          handler: () => {
            console.log('User chose to enter location manually');
          }
        },
        {
          text: 'Enable Location',
          handler: async () => {
            try {
              const result = await Geolocation.requestPermissions();
              if (result.location === 'granted') {
                this.getLocation();
              } else {
                await this.showToast('Location permission denied. Please enter manually.', 'warning');
              }
            } catch (error) {
              console.error('Permission request error:', error);
              await this.showToast('Unable to request location permission.', 'warning');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Method to handle different permission states
  async handleLocationPermission(): Promise<boolean> {
    try {
      const permissions = await Geolocation.checkPermissions();
      
      switch (permissions.location) {
        case 'granted':
          return true;
          
        case 'denied':
          await this.showLocationPermissionAlert();
          return false;
          
        case 'prompt':
        case 'prompt-with-rationale':
          const result = await Geolocation.requestPermissions();
          return result.location === 'granted';
          
        default:
          const requestResult = await Geolocation.requestPermissions();
          return requestResult.location === 'granted';
      }
    } catch (error) {
      console.error('Error handling location permission:', error);
      await this.showToast('Unable to access location services.', 'warning');
      return false;
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }

  async showValidationErrors() {
    const errors = [];
    
    if (this.signupForm.get('fullName')?.hasError('required')) {
      errors.push('Full name is required');
    } else if (this.signupForm.get('fullName')?.hasError('minlength')) {
      errors.push('Full name must be at least 2 characters');
    }
    
    if (this.signupForm.get('phoneNumber')?.hasError('required')) {
      errors.push('Phone number is required');
    } else if (this.signupForm.get('phoneNumber')?.hasError('pattern')) {
      errors.push('Please enter a valid Indian phone number');
    }
    
    if (this.signupForm.get('state')?.hasError('required')) {
      errors.push('State is required');
    }
    
    if (this.signupForm.get('city')?.hasError('required')) {
      errors.push('City/Village is required');
    } else if (this.signupForm.get('city')?.hasError('minlength')) {
      errors.push('City/Village must be at least 2 characters');
    }

    if (errors.length > 0) {
      await this.showToast(errors.join('\n'), 'danger');
    }
  }

  // Helper methods for form validation display
  isFieldInvalid(fieldName: string): boolean {
    const field = this.signupForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.signupForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        const fieldLabels: {[key: string]: string} = {
          'fullName': 'Full Name',
          'phoneNumber': 'Phone Number',
          'state': 'State',
          'city': 'City/Village'
        };
        return `${fieldLabels[fieldName] || fieldName} is required`;
      }
      if (field.errors['minlength']) {
        return `Must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['pattern']) {
        return 'Please enter a valid 10-digit Indian phone number';
      }
    }
    return '';
  }

  // Format phone number as user types
  onPhoneNumberInput(event: any) {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 10) {
      value = value.substring(0, 10); // Limit to 10 digits
    }
    this.signupForm.patchValue({ phoneNumber: value });
  }

  // Reset form
  resetForm() {
    this.signupForm.reset();
    this.isSubmitting = false;
    this.latitude = null;
    this.longitude = null;
  }

  // Manual location test for debugging
  async testLocationServices() {
    console.log('Testing location services...');
    
    const loading = await this.loadingController.create({
      message: 'Testing location services...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Check permissions first
      const permissions = await Geolocation.checkPermissions();
      console.log('Permissions:', permissions);

      if (permissions.location !== 'granted') {
        await loading.dismiss();
        await this.showToast('Location permission not granted. Please enable location access.', 'warning');
        return;
      }

      // Try to get location with minimal settings
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000
      });

      await loading.dismiss();
      console.log('Test location success:', position);
      
      await this.showToast(`Location test successful! Accuracy: ${Math.round(position.coords.accuracy)}m`, 'success');
      
    } catch (error: any) {
      await loading.dismiss();
      console.error('Location test failed:', error);
      
      let message = 'Location test failed. ';
      if (error.code) {
        message += `Error code: ${error.code}. `;
      }
      if (error.message) {
        message += error.message;
      }
      
      await this.showToast(message, 'danger');
    }
  }

  // Google Maps Reverse Geocoding
  private async reverseGeocode(latitude: number, longitude: number): Promise<{city: string, state: string} | null> {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${this.GOOGLE_MAPS_API_KEY}&result_type=locality|administrative_area_level_1|administrative_area_level_2&language=en`;
      
      console.log('Calling geocoding API:', url.replace(this.GOOGLE_MAPS_API_KEY, 'API_KEY_HIDDEN'));
      
      const response = await this.http.get<any>(url).toPromise();
      
      console.log('Geocoding response:', response);
      
      if (response.status === 'OK' && response.results && response.results.length > 0) {
        const result = this.extractCityAndState(response.results);
        console.log('Extracted location:', result);
        return result;
      } else if (response.status === 'ZERO_RESULTS') {
        console.warn('No results found for coordinates:', latitude, longitude);
        await this.showToast('Location found but unable to determine city/state. Please enter manually.', 'warning');
        return null;
      } else if (response.status === 'REQUEST_DENIED') {
        console.error('Google Maps API request denied - check API key');
        await this.showToast('Location service configuration error. Please enter location manually.', 'warning');
        return null;
      } else {
        console.error('Geocoding API error:', response.status, response.error_message);
        return null;
      }
    } catch (error: any) {
      console.error('Error calling reverse geocoding API:', error);
      if (error.status === 0) {
        await this.showToast('Network error. Please check your internet connection.', 'warning');
      }
      return null;
    }
  }

  // Extract city and state from Google Maps API response
  private extractCityAndState(results: any[]): {city: string, state: string} | null {
    let city = '';
    let state = '';
    
    // Look through all results to find the best match
    for (const result of results) {
      const addressComponents = result.address_components;
      
      for (const component of addressComponents) {
        const types = component.types;
        
        // Look for city/locality
        if (types.includes('locality') || types.includes('sublocality_level_1') || types.includes('administrative_area_level_2')) {
          if (!city && component.long_name) {
            city = component.long_name;
          }
        }
        
        // Look for state
        if (types.includes('administrative_area_level_1')) {
          if (!state && component.long_name) {
            state = component.long_name;
          }
        }
      }
      
      // If we found both city and state, break
      if (city && state) {
        break;
      }
    }
    
    // Validate that the state exists in our Indian states array
    const matchedState = this.findMatchingIndianState(state);
    
    if (city && matchedState) {
      return {
        city: city,
        state: matchedState
      };
    }
    
    // If we couldn't find a proper match, try alternative extraction
    return this.alternativeExtraction(results);
  }

  // Find matching Indian state (handles variations in naming)
  private findMatchingIndianState(stateName: string): string | null {
    if (!stateName) return null;
    
    // Direct match
    const directMatch = this.indianStates.find(state => 
      state.toLowerCase() === stateName.toLowerCase()
    );
    
    if (directMatch) return directMatch;
    
    // Partial match for common variations
    const partialMatch = this.indianStates.find(state => 
      state.toLowerCase().includes(stateName.toLowerCase()) || 
      stateName.toLowerCase().includes(state.toLowerCase())
    );
    
    return partialMatch || null;
  }

  // Alternative extraction method for edge cases
  private alternativeExtraction(results: any[]): {city: string, state: string} | null {
    let city = '';
    let state = '';
    
    // Try different component types as fallback
    for (const result of results) {
      const addressComponents = result.address_components;
      
      for (const component of addressComponents) {
        const types = component.types;
        
        // More flexible city detection
        if (!city && (types.includes('sublocality') || types.includes('neighborhood') || types.includes('postal_town'))) {
          city = component.long_name;
        }
        
        // State detection
        if (!state && types.includes('administrative_area_level_1')) {
          const matchedState = this.findMatchingIndianState(component.long_name);
          if (matchedState) {
            state = matchedState;
          }
        }
      }
    }
    
    return (city && state) ? { city, state } : null;
  }
}
