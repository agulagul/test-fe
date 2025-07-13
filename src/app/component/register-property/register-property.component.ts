import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { PropertyService } from '../../service/property.service';
import { HttpClient } from '@angular/common/http';
import { CloudinaryService } from '../../service/cloudinary.service';
import { firstValueFrom } from 'rxjs';
import { AlertService } from '../../service/alert.service';

@Component({
  selector: 'app-register-property',
  standalone: false,

  templateUrl: './register-property.component.html',
  styleUrl: './register-property.component.css'
})
export class RegisterPropertyComponent {
  propertyForm: FormGroup;
  isDragging = false;
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private location: Location,
    private propertyService: PropertyService,
    private http: HttpClient,
    private cloudinaryService: CloudinaryService,
    private alertService: AlertService
  ) {
    this.propertyForm = this.fb.group({
      propertyName: ['', Validators.required],
      Latitude: ['', Validators.required],
      Longitude: ['', Validators.required],
      propertyAddress: ['', Validators.required],
      Deskripsi: ['', Validators.required],
      JenisProperti: ['', Validators.required]
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    this.handleFile(file);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(): void {
    this.isDragging = false;
  }

  private handleFile(file: File): void {
    if (file.type.match('image.*')) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedFile = null;
      this.imagePreview = null;
    }
  }

  selectedLocation: { lat: number; lng: number} | null = null;

  onLocationSelected(location: { lat: number; lng: number }) {
    this.selectedLocation = location;
    this.propertyForm.controls['Latitude'].setValue(location.lat);
    this.propertyForm.controls['Longitude'].setValue(location.lng);
  }

  goBack() {
    this.location.back();
  }

  // Add property type options for dropdown
  propertyTypes = [
    { value: 'Kost Campur', label: 'Kost Campur' },
    { value: 'Kost Khusus Pria', label: 'Kost Khusus Pria' },
    { value: 'Kost Khusus Wanita', label: 'Kost Khusus Wanita' }
  ];

  async onSubmit(): Promise<void> {
    if (this.propertyForm.valid && this.selectedFile) {
      try {
        // 1. Upload image to Cloudinary via service
        const uploadRes: any = await firstValueFrom(this.cloudinaryService.uploadImage(this.selectedFile));
        const imageUrl = uploadRes.secure_url;

        // 2. Get city name from latitude and longitude using Nominatim reverse geocoding
        const lat = this.propertyForm.value.Latitude;
        const lng = this.propertyForm.value.Longitude;
        let city = '';
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await response.json();
          city = data.address?.city || data.address?.town || data.address?.village || '';
        } catch (geoErr) {
          city = '';
        }

        // 3. Send property data to backend with Cloudinary image URL as JSON
        const propertyData = {
          property_name: this.propertyForm.value.propertyName,
          address: this.propertyForm.value.propertyAddress,
          latitude: lat,
          longitude: lng,
          thumbnail_photo_path: imageUrl,
          city: city,
          description: this.propertyForm.value.Deskripsi,
          property_type: this.propertyForm.value.JenisProperti
        };

        this.propertyService.createProperty(propertyData).subscribe({
          next: (res) => {
            this.alertService.success((res as any)?.message || 'Properti berhasil dibuat!');
            this.router.navigate(['landing-page']);
          },
          error: (err) => {
            this.alertService.error((err?.error as any)?.message || 'Gagal membuat properti.');
          }
        });
      } catch (err) {
        alert('Image upload failed');
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['/']);
  }
}
