import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ComplaintService } from '../../../service/complaint.service';
import { CloudinaryService } from '../../../service/cloudinary.service';
import { Router } from '@angular/router';
import { AlertService } from '../../../service/alert.service';

@Component({
  selector: 'app-create-complaint',
  standalone: false,

  templateUrl: './create-complaint.component.html',
  styleUrl: './create-complaint.component.css'
})
export class CreateComplaintComponent {
  complaintForm: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  isSubmitting = false;
  isError = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private complaintService: ComplaintService,
    private cloudinaryService: CloudinaryService,
    private router: Router,
    private alertService: AlertService
  ) {
    this.complaintForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(30)]],
      description: ['', [Validators.maxLength(250)]],
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    // Reset file input
    const fileInput = document.getElementById('photo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSubmit(): void {
    if (this.complaintForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.isError = false;
    this.errorMessage = '';

    const submitComplaint = (photoUrl?: string, fileName?: string) => {
      const payload: any = {
        title: this.complaintForm.get('title')?.value,
        description: this.complaintForm.get('description')?.value,
        photos: []
      };
      if (photoUrl && fileName) {
        payload.photos.push({ file_name: fileName, file_path: photoUrl });
      }
      this.complaintService.createComplaint(payload).subscribe({
        next: (res: any) => {
          this.isSubmitting = false;
          this.complaintForm.reset();
          this.removeImage();
          this.alertService.success((res as any)?.message || 'Keluhan berhasil dikirim!');
          this.router.navigate(['/complain-page']);
        },
        error: (err: any) => {
          this.isSubmitting = false;
          this.isError = true;
          this.errorMessage = 'Gagal mengirim keluhan. Silakan coba lagi.';
          this.alertService.error((err?.error as any)?.message || 'Gagal mengirim keluhan.');
        }
      });
    };

    if (this.selectedFile) {
      this.cloudinaryService.uploadImage(this.selectedFile).subscribe({
        next: (res: any) => {
          submitComplaint(res.secure_url, this.selectedFile?.name);
          this.alertService.success('Foto berhasil diupload!');
        },
        error: (err: any) => {
          this.isSubmitting = false;
          this.isError = true;
          this.errorMessage = 'Gagal upload foto. Silakan coba lagi.';
          this.alertService.error((err?.error as any)?.message || 'Gagal upload foto.');
        }
      });
    } else {
      submitComplaint();
    }
  }
}
