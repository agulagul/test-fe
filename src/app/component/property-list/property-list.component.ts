import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { landingPropertyData } from '../landing-page/landing-page.component';
import { PropertyService } from '../../service/property.service';
import { AlertService } from '../../service/alert.service';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-property-list',
  standalone: false,

  templateUrl: './property-list.component.html',
  styleUrl: './property-list.component.css'
})
export class PropertyListComponent {
  PropListData : landingPropertyData[] = [];
  isPemilik: boolean = false;

  constructor(
    private location: Location,
    private PropService : PropertyService,
    private router: Router,
    private alertService: AlertService,
    private authService: AuthService
  ){
    this.authService.user$.subscribe(user => {
      this.isPemilik = user && user.role_id === 2;
    });
  }

  goBack(): void {
    this.location.back();
  }

  goToDetail(id: any) {
    this.router.navigate(['/property-detail', id]);
  }

  goToEdit(id: any) {
    this.router.navigate(['/edit-property', id]);
  }

  goToRegisterProperty() {
    this.router.navigate(['/register-property']);
  }

  ngOnInit(){
    this.PropService.getOwnerProperties().subscribe(res=>{
      if (res && res.success && Array.isArray(res.data)) {
        this.PropListData = res.data.map((p: any) => ({
          id: p.id,
          name: p.property_name || p.namaProperti || '',
          type: p.property_type || p.jenisKos || '',
          price: p.price || 0, // Adjust if price field exists
          propimage: p.thumbnail_photo_path || p.propimage || 'https://i.pinimg.com/736x/bf/38/8f/bf388f2771f6b5f2fc4df3cc19fdf6ab.jpg',
          location: p.city || p.alamat || '',
          rating: p.rating || 0 // Adjust if rating field exists
        }));
      } else {
        this.PropListData = [];
      }
    }, err => {
      // Handle error if necessary
    })
  }
}
