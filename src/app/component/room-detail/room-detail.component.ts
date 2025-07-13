import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { GamificationComponent } from '../gamification/gamification.component';
import { UnitService } from '../../service/unit.service';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { BookingService } from '../../service/booking.service';
import { AuthService } from '../../service/auth.service';
import { lastValueFrom } from 'rxjs';
import { AlertService } from '../../service/alert.service';

export interface LabelData {
  id: any;
  labeltext: string;
  labelColor: string;
}

@Component({
  selector: 'app-room-detail',
  standalone: false,

  templateUrl: './room-detail.component.html',
  styleUrl: './room-detail.component.css'
})
export class RoomDetailComponent implements OnInit {
  contacts = [
    { name: 'Kurniawan', phone: '039438949230' },
    { name: 'Rudolf', phone: '0397549895230' }
  ];

  RoomId: any;
  labelDataTable: LabelData[] = [{
    id: 1, labeltext: 'bukan', labelColor: 'yellow'
  }, {
    id: 2, labeltext: 'iya', labelColor: 'blue'
  }
  ]
  unitDetail: any = null;
  images = []
  selectedImage: string | null = null;
  generatedLink: string | null = null;
  isPenghuni: boolean = false;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private _formBuilder: FormBuilder,
    private route: Router,
    private location: Location,
    private unitService: UnitService,
    private bookingService: BookingService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private alertService: AlertService
  ) {
    this.authService.user$.subscribe(user => {
      this.isPenghuni = user && user.role_id === 4;
    });
    this.RoomId = this.activatedRoute.snapshot.paramMap.get('id');
  }

  ngOnInit() {
    if (this.RoomId) {
      this.unitService.getUnitById(this.RoomId).subscribe((response: any) => {
        if (response && response.success && response.data) {
          this.unitDetail = response.data;
          if (this.unitDetail.photos && Array.isArray(this.unitDetail.photos)) {
            this.images = this.unitDetail.photos.map((p: any) => p.file_path);
          }
        }
      }, (error) => {
        // this.alertService.error((error?.error as any)?.message || 'Gagal mengambil detail unit.');
      });
    }
  }

  currentIndex = 0;

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  openModal(image: string) {
    this.selectedImage = image;
  }

  async GamificationPopUp() {
    if (!this.isPenghuni) return;
    if (!this.unitDetail?.id) return;
    try {
      const res: any = await lastValueFrom(this.unitService.generateUnitLink(this.unitDetail.id));
      this.generatedLink = res?.data || '';
      this.dialog.open(GamificationComponent, {
        data: { link: this.generatedLink }
      });
    } catch (err) {
      // handle error (show message, etc)
    }
  }

  closeModal() {
    this.selectedImage = null;
  }

  goBack(): void {
    this.location.back();
  }

  openBookingDialog() {
    if (!this.isPenghuni) return;
    const dialogRef = this.dialog.open(BookingConfirmDialogComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const ref = this.activatedRoute.snapshot.queryParamMap.get('ref');
        this.bookingService.createBooking(this.RoomId, ref).subscribe({
          next: (res) => {
            this.alertService.success((res as any)?.message || 'Booking berhasil dibuat!');
          },
          error: (err) => {
            this.alertService.error((err?.error as any)?.message || 'Gagal membuat booking.');
          }
        });
      }
    });
  }

  getFacilityCategories(facilities: any[]): { category: string, items: any[] }[] {
    if (!facilities) return [];
    const map = new Map<string, any[]>();
    facilities.forEach(fac => {
      if (!map.has(fac.facility_category)) {
        map.set(fac.facility_category, []);
      }
      map.get(fac.facility_category)!.push(fac);
    });
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }

  getFacilityIcon(category: string): string {
    switch (category) {
      case 'ELEKTRONIK': return '🔌';
      case 'PERALATAN TIDUR': return '🛏️';
      case 'PENYIMPANAN': return '🗄️';
      case 'PERALATAN BELAJAR': return '📚';
      case 'SANITASI': return '🚿';
      case 'VENTILASI': return '🪟';
      default: return '🏷️';
    }
  }

}

@Component({
  selector: 'booking-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <div style="padding: 24px; max-width: 350px; overflow: hidden;">
      <h2 style="margin-top:0;">Konfirmasi Booking</h2>
      <div>Apakah Anda yakin ingin booking unit ini?</div>
      <div style="text-align:right; margin-top:16px;">
        <button mat-button (click)="dialogRef.close(false)">Batal</button>
        <button mat-button color="primary" (click)="dialogRef.close(true)">Iya</button>
      </div>
    </div>
  `
})
export class BookingConfirmDialogComponent {
  constructor(public dialogRef: MatDialogRef<BookingConfirmDialogComponent>) {}
}
