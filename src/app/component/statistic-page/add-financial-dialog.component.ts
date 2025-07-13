import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PropertyService } from '../../service/property.service';

@Component({
  selector: 'app-add-financial-dialog',
  standalone: false,
  templateUrl: './add-financial-dialog.component.html',
  styleUrls: ['./add-financial-dialog.component.css']
})
export class AddFinancialDialogComponent {
  financialForm: FormGroup;
  properties: any[] = [];
  units: any[] = [];
  selectedProperty: any = null;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddFinancialDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private propertyService: PropertyService
  ) {
    this.financialForm = this.fb.group({
      property_id: [null, Validators.required],
      unit_id: [null, Validators.required],
      nominalPemasukan: [null, [Validators.required, Validators.min(0)]],
      nominalPengeluaran: [null, [Validators.required, Validators.min(0)]],
      deskripsi: ['', Validators.required],
      tanggal: [null, Validators.required]
    });
    this.loadProperties();
    // Jika data edit, patch value
    if (data) {
      if (data.property_id) {
        this.financialForm.get('property_id')?.setValue(data.property_id);
        this.onPropertyChange(data.property_id);
      }
      if (data.unit_id) {
        // Tunggu units ter-load sebelum set unit_id
        setTimeout(() => {
          this.financialForm.get('unit_id')?.setValue(data.unit_id);
        }, 200);
      }
      if (data.income !== undefined) this.financialForm.get('nominalPemasukan')?.setValue(data.income);
      if (data.expense !== undefined) this.financialForm.get('nominalPengeluaran')?.setValue(data.expense);
      if (data.description) this.financialForm.get('deskripsi')?.setValue(data.description);
      if (data.date) this.financialForm.get('tanggal')?.setValue(data.date);
    }
  }

  loadProperties() {
    this.propertyService.getOwnerProperties().subscribe((res: any) => {
      this.properties = res.data || res;
    });
  }

  onPropertyChange(propertyId: any) {
    this.units = [];
    this.financialForm.get('unit_id')?.setValue(null);
    this.propertyService.getPropertyById(propertyId).subscribe((res: any) => {
      // Cek struktur balikan unit
      if (res.data && res.data.units) {
        this.units = res.data.units;
      } else if (res.units) {
        this.units = res.units;
      } else {
        this.units = [];
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.financialForm.valid) {
      this.dialogRef.close({
        property_id: this.financialForm.value.property_id,
        unit_id: this.financialForm.value.unit_id,
        income: this.financialForm.value.nominalPemasukan,
        expense: this.financialForm.value.nominalPengeluaran,
        description: this.financialForm.value.deskripsi,
        date: this.financialForm.value.tanggal
      });
    }
  }
}
