import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UnitService {
  constructor(private http: HttpClient) {}

  getUnitById(id: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/unit/${id}`);
  }

  createUnit(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/unit`, data);
  }

  generateUnitLink(unitId: string | number) {
    return this.http.get(`${environment.apiUrl}/unit/generateLink/${unitId}`);
  }
}
