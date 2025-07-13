import { style } from "@angular/animations";
import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { Chart, registerables } from 'chart.js'
import { MatDialog } from '@angular/material/dialog';
import { AddFinancialDialogComponent } from './add-financial-dialog.component';
import { FinancialService } from '../../service/financial.service';
import { FinancialSummaryService } from '../../service/financial-summary.service';
import { PropertyService } from '../../service/property.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertService } from '../../service/alert.service';

Chart.register(...registerables)

@Component({
  selector: 'app-statistic-page',
  standalone: false,

  templateUrl: './statistic-page.component.html',
  styleUrl: './statistic-page.component.css'
})
export class StatisticPageComponent{
   showFilterDialog = false;
  selectedCategory = 'all';
  categories = ['Category 1', 'Category 2', 'Category 3', 'Category 4'];

  filterType: 'year' | 'month' | 'date' = 'year';
  filterYear: number | null = null;
  filterMonth: number | null = null;
  filterDate: Date | null = null;
  filterDay: number | null = null;
  availableDays: number[] = [];
  summaryData: any = null;
  selectedPropertyId: number | null = null;
  properties: any[] = [];

  infoMessage: string = 'Silakan terapkan filter terlebih dahulu untuk melihat statistik.';

  @ViewChild('myChartCanvas', { static: false }) myChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChartCanvas', { static: false }) pieChartCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(
    private dialog: MatDialog,
    private financialService: FinancialService,
    private financialSummaryService: FinancialSummaryService,
    private propertyService: PropertyService,
    private snackBar: MatSnackBar,
    private alertService: AlertService
  ) {}

  openFilterDialog(): void {
    this.showFilterDialog = true;
  }

  closeFilterDialog(): void {
    this.showFilterDialog = false;
  }

  renderCharts(labels: string[], income: number[], outcome: number[], pieData: any) {
    if (this.myChartCanvas) {
      if (!this.chart) {
        this.chart = new Chart(this.myChartCanvas.nativeElement, this.config);
      }
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = income;
      this.chart.data.datasets[1].data = outcome;
      this.chart.update();
    }
    if (this.pieChartCanvas) {
      if (!this.pieChart) {
        this.pieChart = new Chart(this.pieChartCanvas.nativeElement, {
          type: 'pie',
          data: pieData,
          options: { aspectRatio: 1 }
        });
      } else {
        this.pieChart.data = pieData;
        this.pieChart.update();
      }
    }
  }

  applyFilters(): void {
    this.infoMessage = '';
    if (!this.selectedPropertyId) {
      alert('Pilih properti terlebih dahulu!');
      return;
    }
    this.chartVisible = true;
    this.financialService.getFinancialByProperty(this.selectedPropertyId).subscribe((res: any) => {
      if (res && res.data && Array.isArray(res.data)) {
        let filteredData = res.data;
        if (this.filterType === 'year' && this.filterYear) {
          filteredData = filteredData.filter((item: any) => {
            const year = new Date(item.date).getFullYear();
            return year === this.filterYear;
          });
        } else if (this.filterType === 'month' && this.filterYear && this.filterMonth) {
          filteredData = filteredData.filter((item: any) => {
            const dateObj = new Date(item.date);
            return dateObj.getFullYear() === this.filterYear && (dateObj.getMonth() + 1) === this.filterMonth;
          });
        } else if (this.filterType === 'date' && this.filterYear && this.filterMonth && this.filterDay) {
          filteredData = filteredData.filter((item: any) => {
            const dateObj = new Date(item.date);
            return dateObj.getFullYear() === this.filterYear && (dateObj.getMonth() + 1) === this.filterMonth && dateObj.getDate() === this.filterDay;
          });
        }
        // Urutkan data berdasarkan tanggal ascending
        filteredData = filteredData.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const labels = filteredData.map((item: any) => item.date);
        const income = filteredData.map((item: any) => item.income);
        const outcome = filteredData.map((item: any) => item.expense);
        // Pie chart data: total income & total expense
        let totalIncome = 0;
        let totalExpense = 0;
        filteredData.forEach((item: any) => {
          totalIncome += item.income || 0;
          totalExpense += item.expense || 0;
        });
        const pieData = {
          labels: ['Income', 'Expense'],
          datasets: [{
            data: [totalIncome, totalExpense],
            backgroundColor: ['#4caf50', '#f44336'],
          }]
        };
        setTimeout(() => {
          this.renderCharts(labels, income, outcome, pieData);
        });
        // Update tableData dari filteredData
        this.tableData = filteredData.map((item: any) => ({
          Tanggal: item.date,
          Pemasukan: item.income,
          Pengeluaran: item.expense,
          Properti: item.property_name || this.getPropertyName(item.property_id),
          Unit: item.unit_name || this.getUnitName(item.unit_id),
          Deskripsi: item.description || item.deskripsi || '',
          id: item.id,
          property_id: item.property_id,
          unit_id: item.unit_id
        }));
        this.tableColumns = ['Tanggal', 'Properti', 'Unit', 'Pemasukan', 'Pengeluaran', 'Deskripsi'];
      }
    });
    this.closeFilterDialog();
  }

  public config: any = {
    type: 'line',

    data: {
      labels: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'november', 'december'],
      datasets: [
        {
          label: 'Income',
          data: [65, 59, 80, 81, 56, 55, 40],
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: 'Expense',
          data: [15, 24, 19, 9, 27, 33, 24],
          fill: false,
          borderColor: '',
          tension: 0.1
        }
      ]

    },options:{
      aspectRatio: 1
    }

  };
  chart: any;
  chartVisible: boolean = false;
  pieChart: any;

  tableData: any[] = [];
  tableColumns: string[] = ['Bulan', 'Pemasukan', 'Pengeluaran'];

  ngOnInit(){
    this.propertyService.getOwnerProperties().subscribe((res: any) => {
      this.properties = res.data || res;
      this.infoMessage = 'Silakan terapkan filter terlebih dahulu untuk melihat statistik.';
    });
  }

  ngDoCheck() {
    // Update availableDays jika filterType 'date'
    if (this.filterType === 'date' && this.filterYear && this.filterMonth) {
      const daysInMonth = new Date(this.filterYear, this.filterMonth, 0).getDate();
      this.availableDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
      // Reset filterDay jika di luar range
      if (this.filterDay && (this.filterDay < 1 || this.filterDay > daysInMonth)) {
        this.filterDay = null;
      }
    } else {
      this.availableDays = [];
      this.filterDay = null;
    }
  }

  loadFinancialStatistic(propertyId: number) {
    this.financialService.getFinancialByProperty(propertyId).subscribe((res: any) => {
      // API response: { success, message, data: FinancialDTO[] }
      if (res && res.data && Array.isArray(res.data)) {
        const labels = res.data.map((item: any) => item.date);
        const income = res.data.map((item: any) => item.income);
        const outcome = res.data.map((item: any) => item.expense);
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = income;
        this.chart.data.datasets[1].data = outcome;
        this.chart.update();
      }
    });
  }

  onPropertyChange(propertyId: number) {
    this.selectedPropertyId = propertyId;
    this.loadFinancialStatistic(propertyId);
  }

  openAddFinancialDialog(): void {
    const dialogRef = this.dialog.open(AddFinancialDialogComponent, {
      width: '400px',
      data: {}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.financialService.addFinancialReport({
          property_id: result.property_id,
          unit_id: result.unit_id,
          income: result.income,
          expense: result.expense,
          description: result.description,
          date: result.date
        }).subscribe({
          next: (res) => {
            this.alertService.success((res as any)?.message || 'Laporan keuangan berhasil ditambahkan!');
          },
          error: (err) => {
            this.alertService.error((err?.error as any)?.message || 'Gagal menambah laporan keuangan.');
          }
        });
      }
    });
  }

  onEditReport(row: any) {
    const dialogRef = this.dialog.open(AddFinancialDialogComponent, {
      width: '400px',
      data: {
        id: row.id,
        property_id: this.selectedPropertyId,
        income: row.Pemasukan,
        expense: row.Pengeluaran,
        date: row.Tanggal,
        description: row.Deskripsi,
        unit_id: row.unit_id
        // Tambahkan field lain jika diperlukan
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.financialService.updateFinancialReport(row.id, {
          property_id: this.selectedPropertyId,
          income: result.income,
          expense: result.expense,
          date: result.date,
          description: result.description,
          unit_id: result.unit_id
          // Tambahkan field lain jika diperlukan
        }).subscribe({
          next: (res) => {
            this.alertService.success((res as any)?.message || 'Laporan keuangan berhasil diupdate!');
            this.applyFilters(); // Refresh data
          },
          error: (err) => {
            this.alertService.error((err?.error as any)?.message || 'Gagal update laporan keuangan.');
          }
        });
      }
    });
  }

  onDeleteReport(row: any) {
    if (confirm('Yakin ingin menghapus laporan ini?')) {
      // Panggil API DELETE /financial/{id}
      this.financialService.deleteFinancialReport(row.id).subscribe({
        next: (res) => {
          this.alertService.success((res as any)?.message || 'Laporan keuangan berhasil dihapus!');
          this.applyFilters(); // Refresh data
        },
        error: (err) => {
          this.alertService.error((err?.error as any)?.message || 'Gagal hapus laporan keuangan.');
        }
      });
    }
  }

  downloadTableAsPDF() {
    const doc = new jsPDF();
    const columns = this.tableColumns;
    const rows = this.tableData.map(row => columns.map(col => row[col]));
    // Judul
    doc.text('Laporan Keuangan', 14, 16);
    // Info filter
    let filterInfo = '';
    if (this.filterType === 'year' && this.filterYear) {
      filterInfo = `Tahun: ${this.filterYear}`;
    } else if (this.filterType === 'month' && this.filterYear && this.filterMonth) {
      filterInfo = `Tahun: ${this.filterYear}, Bulan: ${this.filterMonth}`;
    } else if (this.filterType === 'date' && this.filterYear && this.filterMonth && this.filterDay) {
      filterInfo = `Tanggal: ${this.filterDay}-${this.filterMonth}-${this.filterYear}`;
    }
    if (this.selectedPropertyId) {
      const propName = this.getPropertyName(this.selectedPropertyId);
      filterInfo += filterInfo ? ` | Properti: ${propName}` : `Properti: ${propName}`;
    }
    if (filterInfo) {
      doc.setFontSize(10);
      doc.text(filterInfo, 14, 22);
    }
    // Tabel
    let tableStartY = filterInfo ? 28 : 22;
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: tableStartY,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [63,81,181] }
    });
    // Chart di bawah tabel
    const lastAutoTable = (doc as any).lastAutoTable;
    let chartY = lastAutoTable && lastAutoTable.finalY ? lastAutoTable.finalY + 10 : tableStartY + 80;
    const chartCanvas = this.myChartCanvas?.nativeElement;
    if (chartCanvas) {
      const chartImg = chartCanvas.toDataURL('image/png', 1.0);
      doc.addImage(chartImg, 'PNG', 14, chartY, 180, 120); // Increased height from 60 to 120
      chartY += 125;
    }
    const pieCanvas = this.pieChartCanvas?.nativeElement;
    if (pieCanvas) {
      const pieImg = pieCanvas.toDataURL('image/png', 1.0);
      doc.addImage(pieImg, 'PNG', 14, chartY, 80, 80); // Undo centering, back to left
    }
    doc.save('laporan-keuangan.pdf');
  }

  // Tambahkan helper untuk ambil nama properti dan unit
  getPropertyName(propertyId: number): string {
    const prop = this.properties.find(p => p.id === propertyId);
    return prop ? prop.property_name : '';
  }
  getUnitName(unitId: number): string {
    for (const prop of this.properties) {
      if (prop.units) {
        const unit = prop.units.find((u: any) => u.id === unitId);
        if (unit) return unit.unit_name;
      }
    }
    return '';
  }
}
