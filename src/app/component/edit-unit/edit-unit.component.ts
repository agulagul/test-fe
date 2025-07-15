import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UnitService } from '../../service/unit.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { PropertyService } from '../../service/property.service';
import { CloudinaryService } from '../../service/cloudinary.service';
import { AlertService } from '../../service/alert.service';

@Component({
  selector: 'app-edit-unit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-unit.component.html',
  styleUrls: ['./edit-unit.component.css']
})
export class EditUnitComponent implements OnInit {
  unitForm: FormGroup;
  unitId: string = '';
  imagePreviews: string[] = [];
  facilities: FormArray;

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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private unitService: UnitService,
    private http: HttpClient,
    private router: Router,
    private propertyService: PropertyService,
    private cloudinaryService: CloudinaryService,
    private alertService: AlertService
  ) {
    this.unitForm = this.fb.group({
      unit_name: [''],
      price: [''],
      unit_width: [''],
      unit_height: [''],
      unit_capacity: [''],
      promo_price: [''],
      deposit_fee: [''],
      description: [''],
      available: [true],
      facilities: this.fb.array([])
    });
    this.facilities = this.unitForm.get('facilities') as FormArray;
  }

  ngOnInit() {
    this.unitId = this.route.snapshot.paramMap.get('id') || '';
    this.unitService.getUnitById(Number(this.unitId)).subscribe((response: any) => {
      if (response && response.success && response.data) {
        const unit = response.data;
        this.unitForm.patchValue({
          unit_name: unit.unit_name,
          price: unit.price,
          unit_width: unit.unit_width,
          unit_height: unit.unit_height,
          unit_capacity: unit.unit_capacity,
          promo_price: unit.promo_price,
          deposit_fee: unit.deposit_fee,
          description: unit.description,
          available: unit.available
        });
        if (unit.facilities) {
          unit.facilities.forEach((fac: any) => {
            this.facilities.push(this.fb.group({
              facility_id: [fac.facility_id],
              facility_category_id: [fac.facility_category_id || fac.facility_category_id],
              facility_category: [fac.facility_category || fac.category],
              facility_name: [fac.facility_name],
              quantity: [fac.quantity],
              notes: [fac.notes]
            }));
          });
        }
        if (unit.photos) {
          this.imagePreviews = unit.photos.map((p: any) => p.file_path);
        }
      }
    });
  }

  get facilityCategories() {
    const categories: { [key: string]: any[] } = {};
    this.facilityList.forEach(fac => {
      if (!categories[fac.category]) categories[fac.category] = [];
      categories[fac.category].push(fac);
    });
    return categories;
  }

  isFacilitySelected(id: number) {
    return this.facilities.controls.some((ctrl: any) => ctrl.value.facility_category_id === id);
  }

  onFacilityAdd(fac: any) {
    if (!this.isFacilitySelected(fac.id)) {
      this.facilities.push(this.fb.group({
        facility_id: [null],
        facility_category_id: [fac.id],
        facility_category: [fac.category],
        facility_name: [fac.facility_name],
        quantity: [1],
        notes: ['']
      }));
    }
  }

  removeFacility(i: number) {
    this.facilities.removeAt(i);
  }

  onSubmit() {
    if (this.unitForm.invalid) return;
    const filesInput = (document.querySelector('input[type=file]') as HTMLInputElement);
    const files = filesInput?.files;
    const facilitiesPayload = this.facilities.value;
    if (files && files.length > 0) {
      const uploadPromises = [];
      for (let i = 0; i < files.length; i++) {
        uploadPromises.push(this.cloudinaryService.uploadImage(files[i]).toPromise());
      }
      Promise.all(uploadPromises).then((results) => {
        const photoUrls = results.map((res: any) => ({ file_path: res.secure_url }));
        const payload = {
          ...this.unitForm.value,
          facilities: facilitiesPayload,
          photos: photoUrls
        };
        this.unitService.updateUnit(this.unitId, payload).subscribe({
          next: (res: any) => {
            this.alertService.success('Unit berhasil diupdate!');
            this.router.navigate(['/room-detail', this.unitId]);
          },
          error: (err) => {
            this.alertService.error('Gagal update unit');
          }
        });
      });
    } else {
      const payload = {
        ...this.unitForm.value,
        facilities: facilitiesPayload
      };
      this.unitService.updateUnit(this.unitId, payload).subscribe({
        next: (res: any) => {
          this.alertService.success('Unit berhasil diupdate!');
          this.router.navigate(['/room-detail', this.unitId]);
        },
        error: (err) => {
          this.alertService.error('Gagal update unit');
        }
      });
    }
  }

  onCancel() {
    this.router.navigate(['/room-detail', this.unitId]);
  }

  onFilesSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviews.push(e.target.result);
        };
        reader.readAsDataURL(files[i]);
      }
    }
  }
  removeImage(index: number) {
    this.imagePreviews.splice(index, 1);
  }
}
