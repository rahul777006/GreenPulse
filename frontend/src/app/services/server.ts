import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Server {

  private apiUrl = 'https://rahul.fast.in.net/farmer/public/api/';
  // private apiUrl = 'http://192.168.100.34:8100/farmer/public/api/';
  // private apiUrl = 'http://localhost/farmer/public/api/';

  httpOptions = {

  }

  // Getter method to access API URL
  get baseApiUrl(): string {
    return this.apiUrl;
  }

    constructor(private http: HttpClient) {
  }

  
  home(): Observable<any> {
    return this.http.get<any>(this.apiUrl+'home',this.httpOptions);
  }

  signup(data:any): Observable<any> {
    return this.http.post(`${this.apiUrl}user/signup`, data,this.httpOptions);
  }

  // Crops related endpoints
  getUserCrops(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}user/cropssss/${userId}`, this.httpOptions);
  }

  addCrop(cropData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}crops`, cropData, this.httpOptions);
  }

  updateCrop(cropId: string, cropData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}crops/${cropId}`, cropData, this.httpOptions);
  }

  deleteCrop(cropId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}crops/${cropId}`, this.httpOptions);
  }
  
}
