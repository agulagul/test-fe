import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { PropertyService } from '../../service/property.service';
import { HttpClient } from '@angular/common/http';
import { CloudinaryService } from '../../service/cloudinary.service';
import { UnitService } from '../../service/unit.service';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-unit',
  standalone: false,

  templateUrl: './add-unit.component.html',
  styleUrl: './add-unit.component.css'
})
export class AddUnitComponent implements OnInit {
  unitForm: FormGroup;
  isDragging = false;
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  selectedFiles: File[] = [];
  imagePreviews: (string | ArrayBuffer | null)[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private location: Location,
    private propertyService: PropertyService,
    private http: HttpClient,
    private cloudinaryService: CloudinaryService,
    private unitService: UnitService,
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.unitForm = this.fb.group({
      property_id: ['', Validators.required],
      unit_name: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      unit_width: ['', [Validators.required, Validators.min(0)]],
      unit_height: ['', [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      available: [true, Validators.required],
      keeper_id: [''],
      promo_price: [''],
      deposit_fee: [''],
      unit_capacity: ['', [Validators.required, Validators.min(1)]],
      occupant_id: [''],
      photos: [[]],
      facilities: this.fb.array([])
    });

    // Set property_id jika ada di route
    const propertyId = this.activatedRoute.snapshot.paramMap.get('propertyId');
    if (propertyId) {
      this.unitForm.patchValue({ property_id: propertyId });
    }

    this.facilitiesFormArray = this.fb.array([]);
    this.unitForm.setControl('facilities', this.facilitiesFormArray);
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

  onFilesSelected(event: any): void {
    const files: FileList = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.match('image.*')) {
        this.selectedFiles.push(file);
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreviews.push(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  selectedLocation: { lat: number; lng: number} | null = null;

  onLocationSelected(location: { lat: number; lng: number }) {
    this.selectedLocation = location;
    this.unitForm.controls['Latitude'].setValue(location.lat);
    this.unitForm.controls['Longitude'].setValue(location.lng);
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

  facilityList = [
    { id: 1, category: 'ELEKTRONIK', facility_name: 'AC' },
    { id: 2, category: 'ELEKTRONIK', facility_name: 'TV' },
    { id: 3, category: 'PERALATAN TIDUR', facility_name: 'Kasur' },
    { id: 4, category: 'PERALATAN TIDUR', facility_name: 'Bantal' },
    { id: 5, category: 'PERALATAN TIDUR', facility_name: 'Guling' },
    { id: 6, category: 'PERALATAN TIDUR', facility_name: 'Sprei' },
    { id: 7, category: 'PENYIMPANAN', facility_name: 'Lemari Baju' },
    { id: 8, category: 'PERALATAN BELAJAR', facility_name: 'Meja' },
    { id: 9, category: 'PERALATAN BELAJAR', facility_name: 'Kursi' },
    { id: 10, category: 'SANITASI', facility_name: 'Kamar Mandi Dalam' },
    { id: 11, category: 'SANITASI', facility_name: 'Kamar Mandi Luar' },
    { id: 12, category: 'SANITASI', facility_name: 'Toilet Jongkok' },
    { id: 13, category: 'SANITASI', facility_name: 'Toilet Duduk' },
    { id: 14, category: 'SANITASI', facility_name: 'Shower' },
    { id: 15, category: 'VENTILASI', facility_name: 'Jendela Dalam' },
    { id: 16, category: 'VENTILASI', facility_name: 'Jendela Luar' }
  ];

  selectedFacilities: any[] = [];
  facilitiesFormArray: any;

  ngOnInit() {
    this.unitForm.setControl('facilities', this.facilitiesFormArray);
  }

  onFacilityToggle(facility: any, checked: boolean) {
    if (checked) {
      this.selectedFacilities.push({
        facility_id: facility.id,
        facility_category_id: facility.id, // backend expects id for category?
        facility_category: facility.category,
        facility_name: facility.facility_name,
        quantity: 1,
        notes: ''
      });
    } else {
      this.selectedFacilities = this.selectedFacilities.filter(f => f.facility_id !== facility.id);
    }
    this.unitForm.patchValue({ facilities: this.selectedFacilities });
  }

  onFacilityCheckboxChange(facility: any, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.onFacilityToggle(facility, checked);
  }

  onFacilityChange(facilityId: number, field: 'quantity' | 'notes', value: any) {
    const fac = this.selectedFacilities.find(f => f.facility_id === facilityId);
    if (fac) {
      fac[field] = value;
      this.unitForm.patchValue({ facilities: this.selectedFacilities });
    }
  }

  onFacilityInputChange(facilityId: number, field: 'quantity' | 'notes', event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.onFacilityChange(facilityId, field, value);
  }

  isFacilitySelected(facilityId: number): boolean {
    return this.selectedFacilities.some(f => f.facility_id === facilityId);
  }

  getFacilityData(facilityId: number): any {
    return this.selectedFacilities.find(f => f.facility_id === facilityId);
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

  async onSubmit(): Promise<void> {
    if (this.unitForm.valid) {
      try {
        // Upload semua foto jika ada
        let photoUrls: any[] = [];
        if (this.selectedFiles.length > 0) {
          for (const file of this.selectedFiles) {
            const uploadRes: any = await firstValueFrom(this.cloudinaryService.uploadImage(file));
            const { width, height } = await this.getImageDimensions(file);
            photoUrls.push({
              file_path: uploadRes.secure_url,
              file_name: file.name,
              width,
              height
            });
          }
        }
        // Siapkan payload unit
        const unitData = {
          ...this.unitForm.value,
          price: Number(this.unitForm.value.price),
          unit_width: Number(this.unitForm.value.unit_width),
          unit_height: Number(this.unitForm.value.unit_height),
          unit_capacity: Number(this.unitForm.value.unit_capacity),
          promo_price: this.unitForm.value.promo_price ? Number(this.unitForm.value.promo_price) : undefined,
          deposit_fee: this.unitForm.value.deposit_fee ? Number(this.unitForm.value.deposit_fee) : undefined,
          photos: photoUrls,
          facilities: this.selectedFacilities // pastikan facilities terisi
        };
        this.unitService.createUnit(unitData).subscribe({
          next: (res) => {
            this.snackBar.open(res?.message || 'Unit berhasil dibuat!', 'Tutup', { duration: 3000 });
            this.router.navigate(['property-detail', unitData.property_id]);
          },
          error: (err) => {
            this.snackBar.open(err?.error?.message || 'Gagal membuat unit.', 'Tutup', { duration: 3000 });
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

  onFacilitiesChange(facilities: any[]) {
    this.selectedFacilities = facilities;
    this.unitForm.patchValue({ facilities });
  }

  onFacilityAdd(fac: any) {
    if (!this.isFacilitySelected(fac.id)) {
      this.selectedFacilities.push({
        facility_id: fac.id,
        facility_category_id: fac.id, // sesuaikan jika ada id kategori
        facility_category: fac.category,
        facility_name: fac.facility_name,
        quantity: 1,
        notes: ''
      });
      (this.facilitiesFormArray as any).push(this.fb.group({
        facility_id: [fac.id],
        facility_category_id: [fac.id],
        facility_category: [fac.category],
        facility_name: [fac.facility_name],
        quantity: [1, [Validators.required, Validators.min(1)]],
        notes: ['']
      }));
      this.unitForm.patchValue({ facilities: this.selectedFacilities });
    }
  }

  removeFacility(index: number) {
    this.selectedFacilities.splice(index, 1);
    (this.facilitiesFormArray as any).removeAt(index);
    this.unitForm.patchValue({ facilities: this.selectedFacilities });
  }

  get facilityCategories() {
    const categories: { [key: string]: any[] } = {};
    this.facilityList.forEach(fac => {
      if (!categories[fac.category]) categories[fac.category] = [];
      categories[fac.category].push(fac);
    });
    return categories;
  }

  get facilities(): FormArray {
    return this.unitForm.get('facilities') as FormArray;
  }
}
