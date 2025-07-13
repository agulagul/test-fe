import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  constructor(private http: HttpClient) {}

  createProperty(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/property`, data);
  }

  getAllProperties(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/property`);
  }

  getPropertyById(id: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/property/${id}`);
  }

  addFacilitiesToProperty(propertyId: number, facilities: any[]): Observable<any> {
    return this.http.post(`${environment.apiUrl}/property/${propertyId}/facility`, facilities);
  }

  addPhotosToProperty(propertyId: number, photos: any[]): Observable<any> {
    return this.http.post(`${environment.apiUrl}/property/${propertyId}/photo`, photos);
  }

  getOwnerProperties(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/property/owner`);
  }

  updateProperty(id: any, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/property/${id}`, data);
  }
}
