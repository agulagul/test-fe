import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { PropertyService } from '../../service/property.service';
import { CloudinaryService } from '../../service/cloudinary.service';
import { firstValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-edit-property',
  standalone: false,
  templateUrl: './edit-property.component.html',
  styleUrl: './edit-property.component.css'
})
export class EditPropertyComponent implements OnInit {
  propertyForm: FormGroup;
  isDragging = false;
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  propertyId: any = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private location: Location,
    private propertyService: PropertyService,
    private cloudinaryService: CloudinaryService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
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

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.propertyId = id;
        this.propertyService.getPropertyById(+id).subscribe((res: any) => {
          const p = res.data || res;
          this.propertyForm.patchValue({
            propertyName: p.property_name || p.namaProperti || '',
            Latitude: p.latitude || '',
            Longitude: p.longitude || '',
            propertyAddress: p.address || p.alamat || '',
            Deskripsi: p.description || '',
            JenisProperti: p.property_type || p.jenisKos || ''
          });
          this.imagePreview = p.thumbnail_photo_path || '';
        });
      }
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

  async onSubmit(): Promise<void> {
    if (this.propertyForm.valid && this.propertyId) {
      try {
        let imageUrl = this.imagePreview;
        if (this.selectedFile) {
          const uploadRes: any = await firstValueFrom(this.cloudinaryService.uploadImage(this.selectedFile));
          imageUrl = uploadRes.secure_url;
        }
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
        this.propertyService.updateProperty(this.propertyId, propertyData).subscribe({
          next: (res) => {
            this.snackBar.open(res?.message || 'Properti berhasil diupdate!', 'Tutup', { duration: 3000 });
            this.router.navigate(['/property-list']);
          },
          error: (err) => {
            this.snackBar.open(err?.error?.message || 'Gagal update properti.', 'Tutup', { duration: 3000 });
          }
        });
      } catch (err) {
        alert('Image upload failed');
      }
    }
  }

  goBack() {
    this.location.back();
  }

  propertyTypes = [
    { value: 'Kost Campur', label: 'Kost Campur' },
    { value: 'Kost Khusus Pria', label: 'Kost Khusus Pria' },
    { value: 'Kost Khusus Wanita', label: 'Kost Khusus Wanita' }
  ];

  onLocationSelected(location: { lat: number; lng: number }) {
    this.propertyForm.controls['Latitude'].setValue(location.lat);
    this.propertyForm.controls['Longitude'].setValue(location.lng);
  }
}
