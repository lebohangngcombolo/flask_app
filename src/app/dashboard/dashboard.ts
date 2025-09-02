import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, User, SavingsGoal } from '../api';
import { AuthService } from '../auth';
import { Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { ChatbotComponent } from '../chatbot/chatbot';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, ChatbotComponent]
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  stats: any = {};
  goal: SavingsGoal = { label: '', target: 0, progress: 0 };
  recent: Array<{ date: string; amount: number; description: string }> = [];
  loading = true;
  error: string | null = null;

  // added
  goalModalOpen = false;
  Math = Math;

  trendTab: 'daily' | 'weekly' | 'monthly' = 'monthly';
  chart: Record<'daily'|'weekly'|'monthly', ChartConfiguration<'line'>['data']> = {
    daily:   { labels: [], datasets: [{ label: 'Contributions', data: [], borderColor: '#6366f1', tension: 0.4 }] },
    weekly:  { labels: [], datasets: [{ label: 'Contributions', data: [], borderColor: '#6366f1', tension: 0.4 }] },
    monthly: { labels: [], datasets: [{ label: 'Contributions', data: [], borderColor: '#6366f1', tension: 0.4 }] }
  };
  chartOptions: ChartConfiguration<'line'>['options'] = {
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    responsive: true,
    maintainAspectRatio: false
  };

  constructor(private auth: AuthService, private api: ApiService, private router: Router) {}

  async ngOnInit() {
    this.auth.currentUser$.subscribe(u => {
      this.currentUser = u;
      if (!u) this.router.navigate(['/login']);
    });

    try {
      const [stats, goal] = await Promise.all([
        this.api.getUserStats().toPromise(),
        this.api.getSavingsGoal().toPromise()
      ]);
      this.stats = stats || {};
      this.goal = goal || { label: '', target: 0, progress: 0 };

      const daily = (this.stats.dailySummary ?? []).map((x: any) => x.total);
      const weekly = (this.stats.weeklySummary ?? []).map((x: any) => x.total);
      const monthly = (this.stats.monthlySummary ?? []).map((x: any) => x.total);

      this.chart.daily.labels = (this.stats.dailySummary ?? []).map((x: any) => x.date);
      this.chart.weekly.labels = (this.stats.weeklySummary ?? []).map((x: any) => x.week);
      this.chart.monthly.labels = (this.stats.monthlySummary ?? []).map((x: any) => x.month);

      this.chart.daily.datasets[0].data = daily;
      this.chart.weekly.datasets[0].data = weekly;
      this.chart.monthly.datasets[0].data = monthly;

      this.recent = this.stats.recentTransactions ?? [];
    } catch (e: any) {
      this.error = e?.error?.message || e?.message || 'Failed to load dashboard data';
    } finally {
      this.loading = false;
    }
  }

  async saveGoal() {
    if (!this.goal.label || !this.goal.target) {
      alert('Please enter a goal name and target amount.');
      return;
    }
    await this.api.setSavingsGoal(this.goal).toPromise();
    const res = await this.api.getSavingsGoal().toPromise();
    this.goal = res || { label: '', target: 0, progress: 0 };
    this.goalModalOpen = false;
  }

  goGroups() { this.router.navigateByUrl('/dashboard/groups'); }
}
