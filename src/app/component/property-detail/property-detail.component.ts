import { Component, OnInit } from '@angular/core';
import { Form, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { GalleryModule, GalleryItem, ImageItem } from 'ng-gallery';
import { MatDialog } from '@angular/material/dialog';
import { PropertyService } from '../../service/property.service';
import { AuthService } from '../../service/auth.service';
import { AddFacilityDialogComponent } from '../pop-up/add-facility-dialog/add-facility-dialog.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CloudinaryService } from '../../service/cloudinary.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertService } from '../../service/alert.service';

export interface roomDetailData{
  id: any;
  roomName: string;
  price: number;
  propimage: string;
  status: number;
}

interface Image {
  src: any
}

@Component({
  selector: 'app-property-detail',
  standalone: false,

  templateUrl: './property-detail.component.html',
  styleUrl: './property-detail.component.css',
})
export class PropertyDetailComponent implements OnInit{
  selectedTab: string = 'kamar';
  PropertyId: any;
  propertyDetail: any = null;
  userRole: string = '';

  images: string[] = [];

  units : roomDetailData[] = [];

  // Tambahkan variabel untuk viewer foto
  currentIndex = 0;
  selectedImage: string | null = null;

  constructor( private activatedRoute: ActivatedRoute, private route: Router, private location: Location, private propertyService: PropertyService, private authService: AuthService, private dialog: MatDialog, private http: HttpClient, private cloudinaryService: CloudinaryService, private snackBar: MatSnackBar, private alertService: AlertService) {
    this.PropertyId = this.activatedRoute.snapshot.paramMap.get('id');
    this.authService.user$.subscribe(user => {
      this.userRole = user && user.role_id === 2 ? 'pemilik' : '';
    });
  }

  changeTab(tab: string) {
    this.selectedTab = tab;
  }

  ngOnInit(){
    if (this.PropertyId) {
      this.propertyService.getPropertyById(this.PropertyId).subscribe((response: any) => {
        if (response && response.success && response.data) {
          this.propertyDetail = response.data;
          if (response.data.units && Array.isArray(response.data.units)) {
            this.units = response.data.units.map((unit: any) => ({
              id: unit.id,
              roomName: unit.unit_name,
              price: unit.price,
              propimage: (unit.photos && unit.photos.length > 0) ? unit.photos[0].file_path : '',
              status: unit.available ? 1 : 2
            }));
          } else {
            this.units = [];
          }
          // Inisialisasi images: thumbnail + photos unik
          const photoArr = Array.isArray(this.propertyDetail?.photos)
            ? this.propertyDetail.photos.map((p: any) => p.file_path)
            : [];
          const thumb = this.propertyDetail?.thumbnail_photo_path;
          this.images = thumb ? [thumb, ...photoArr.filter((p: string) => p !== thumb)] : photoArr;
        }
      }, (error) => {
        // this.alertService.error((error?.error as any)?.message || 'Gagal mengambil detail properti.');
      });
    }
  }

  goBack(): void {
    this.location.back();
  }

  goToDetails(id: any){
    this.route.navigate(['/property-detail', id]);
  }

  goToRoomDetails(id: any){
    this.route.navigate(['/room-detail', id]);
  }

  goToAddUnit() {
    if (this.propertyDetail && this.propertyDetail.id) {
      this.route.navigate(['/add-unit', this.propertyDetail.id]);
    }
  }

  openAddFacilityDialog() {
    const dialogRef = this.dialog.open(AddFacilityDialogComponent, {
      width: '500px',
      data: { propertyId: this.PropertyId }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && Array.isArray(result)) {
        // Gunakan propertyService untuk POST /property/{id}/facility
        this.propertyService.addFacilitiesToProperty(this.PropertyId, result).subscribe({
          next: (res) => {
            this.alertService.success((res as any)?.message || 'Fasilitas berhasil ditambahkan!');
            // Refresh data fasilitas jika perlu
          },
          error: (err) => {
            this.alertService.error((err?.error as any)?.message || 'Gagal menambahkan fasilitas.');
          }
        });
      }
    });
  }

  async openAddPropertyPhotoDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (event: any) => {
      const files: FileList = event.target.files;
      if (!files || files.length === 0) return;
      const photoPayload: any[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Upload ke Cloudinary
        const uploadRes = await this.cloudinaryService.uploadImage(file).toPromise();
        // Dapatkan dimensi gambar
        const imgDims = await this.getImageDimensions(file);
        photoPayload.push({
          file_name: file.name,
          file_path: uploadRes.secure_url,
          width: imgDims.width,
          height: imgDims.height
        });
      }
      // POST ke backend pakai propertyService
      this.propertyService.addPhotosToProperty(this.PropertyId, photoPayload).subscribe({
        next: (res) => {
          this.alertService.success((res as any)?.message || 'Foto berhasil ditambahkan!');
          // Refresh propertyDetail jika perlu
        },
        error: (err) => {
          this.alertService.error((err?.error as any)?.message || 'Gagal upload foto.');
        }
      });
    };
    input.click();
  }

  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  getFacilityCategories(facilities: any[]): { category: string, items: any[] }[] {
    if (!facilities) return [];
    const grouped: { [key: string]: any[] } = {};
    facilities.forEach(fac => {
      const cat = fac.facility_category || 'Lainnya';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(fac);
    });
    return Object.keys(grouped).map(cat => ({ category: cat, items: grouped[cat] }));
  }

  get propertyPhotos(): any[] {
    return Array.isArray(this.propertyDetail?.photos) ? this.propertyDetail.photos : [];
  }

  // Tambahkan fungsi untuk viewer foto
  prev() {
    if (this.images.length > 0) {
      this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    }
  }

  next() {
    if (this.images.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
    }
  }

  openModal(image: string) {
    this.selectedImage = image;
  }

  closeModal() {
    this.selectedImage = null;
  }
}
