import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Server } from './server';

@Injectable({
  providedIn: 'root'
})
export class CropsService {

  constructor(private server: Server, private http: HttpClient) { }

  // Get all crops for a user
  getUserCrops(userId: string): Observable<any> {
    return this.http.get(`${this.server.baseApiUrl}crops/user/${userId}`);
  }

  // Add a new crop
  addCrop(cropData: any): Observable<any> {
    return this.http.post(`${this.server.baseApiUrl}crops`, cropData);
  }

  // Update a crop
  updateCrop(cropId: string, cropData: any): Observable<any> {
    return this.http.put(`${this.server.baseApiUrl}crops/${cropId}`, cropData);
  }

  // Delete a crop
  deleteCrop(cropId: string): Observable<any> {
    return this.http.delete(`${this.server.baseApiUrl}crops/${cropId}`);
  }

  // Get crop image from Unsplash based on crop name
  getCropImageFromUnsplash(cropName: string): string {
    const imageMap: {[key: string]: string} = {
      'Wheat': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop&q=80',
      'Rice': 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&h=300&fit=crop&q=80',
      'Corn': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop&q=80',
      'Cotton': 'https://static.vecteezy.com/system/resources/thumbnails/046/349/194/small_2x/calming-ready-to-harvest-cotton-landscapes-for-web-use-free-photo.jpeg',
      'Sugarcane': 'https://agritimes.co.in/assets/images/the-sweet-and-sour-tale-of-sugarcane-crop-in-india-english.jpeg',
      'Mustard': 'https://images.unsplash.com/photo-1605522397255-98e4b2e0c1e1?w=400&h=300&fit=crop&q=80',
      'Soybean': 'https://images.unsplash.com/photo-1589459874463-1fd2b3dd80f4?w=400&h=300&fit=crop&q=80',
      'Barley': 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&h=300&fit=crop&q=80',
      'Potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop&q=80',
      'Tomato': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop&q=80',
      'Onion': 'https://images.unsplash.com/photo-1588865198312-64baaeafc749?w=400&h=300&fit=crop&q=80',
      'Garlic': 'https://images.unsplash.com/photo-1586016243435-3c86e0fdcb04?w=400&h=300&fit=crop&q=80',
      'Chili': 'https://images.unsplash.com/photo-1583032015870-403bb37c90d9?w=400&h=300&fit=crop&q=80',
      'Turmeric': 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&h=300&fit=crop&q=80'
    };
    
    // Return specific image or fallback to a generic crop image
    return imageMap[cropName] || `https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop&q=80&t=${cropName.toLowerCase()}`;
  }
}
