import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// List fasilitas sama seperti di add-unit.component.ts
const FACILITY_LIST = [
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

@Component({
  selector: 'app-add-facility-dialog',
  templateUrl: './add-facility-dialog.component.html',
  styleUrls: ['./add-facility-dialog.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule]
})
export class AddFacilityDialogComponent implements OnInit {
  facilityForm: FormGroup;
  facilityList = FACILITY_LIST;
  groupedFacilities: { [key: string]: any[] } = {};

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddFacilityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.facilityForm = this.fb.group({
      facilities: this.fb.array([])
    });
    this.groupFacilities();
  }

  groupFacilities() {
    this.groupedFacilities = {};
    this.facilityList.forEach(fac => {
      if (!this.groupedFacilities[fac.category]) this.groupedFacilities[fac.category] = [];
      this.groupedFacilities[fac.category].push(fac);
    });
  }

  get facilities() {
    return this.facilityForm.get('facilities') as FormArray;
  }

  addFacilityFromList(fac: any) {
    // Cegah duplikasi
    if (this.facilities.value.some((f: any) => f.facility_id === fac.id)) return;
    this.facilities.push(this.fb.group({
      facility_id: [fac.id],
      facility_category_id: [fac.id], // jika ada id kategori, bisa diganti
      facility_category: [fac.category],
      facility_name: [fac.facility_name],
      quantity: [1, [Validators.required, Validators.min(1)]],
      notes: ['']
    }));
  }

  removeFacility(index: number) {
    this.facilities.removeAt(index);
  }

  onSubmit() {
    if (this.facilityForm.valid) {
      this.dialogRef.close(this.facilityForm.value.facilities);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  ngOnInit() {
    // Tidak perlu baris default, user pilih dari list
  }

  isFacilitySelected(facilityId: number): boolean {
    return this.facilities.value.some((f: any) => f.facility_id === facilityId);
  }
}
