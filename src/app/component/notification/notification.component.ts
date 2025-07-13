import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { NotificationService } from '../../service/notification.service';
import { BookingService } from '../../service/booking.service';
import { AlertService } from '../../service/alert.service';
import { NotifDialogComponent } from '../pop-up/notif-dialog/notif-dialog.component';

interface Notification {
  title: string;
  content: string;
  bookingId?: number;
}

@Component({
  selector: 'app-notification',
  standalone: false,

  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(
    private notificationService: NotificationService,
    private bookingService: BookingService,
    private dialog: MatDialog,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.notificationService.getUserNotifications().subscribe({
      next: (res) => {
        if (res && res.success && Array.isArray(res.data)) {
          this.notifications = res.data.map((item: any) => ({
            title: item.notification_category || '-',
            content: item.content || item.message || '-',
            bookingId: item.booking_id || item.billing_id || undefined
          }));
        }
      },
      error: (err) => {
        this.notifications = [];
      }
    });
  }

  onApproveBooking(notification: Notification) {
    const dialogRef = this.dialog.open(NotifDialogComponent, {
      data: notification
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'APPROVE' || result === 'REJECT') {
        if (notification.bookingId) {
          this.bookingService.approveBooking(notification.bookingId, result).subscribe({
            next: (res) => {
              this.alertService.success((res as any)?.message || 'Booking berhasil disetujui!');
            },
            error: (err) => {
              this.alertService.error((err?.error as any)?.message || 'Gagal menyetujui booking.');
            }
          });
        }
      }
    });
  }
}
