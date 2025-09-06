import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, FAQ, FAQForm, AdminNotification } from '../api';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-faq-management',
  standalone: true,
  templateUrl: './faq-management.html',
  styleUrls: ['./faq-management.scss'],
  imports: [CommonModule, FormsModule]
})
export class FAQManagement implements OnInit {
  faqs: FAQ[] = [];
  notifications: AdminNotification[] = [];
  loading = false;
  error: string | null = null;
  search = '';
  category = '';
  categories: string[] = [];
  
  // Modal state
  showModal = false;
  submitting = false;
  editingFAQ: FAQ | null = null;
  
  // Form state
  form: FAQForm = {
    question: '',
    answer: '',
    category: '',
    is_published: true
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.fetchFAQs();
    this.fetchNotifications();
  }

  async fetchFAQs() {
    this.loading = true;
    this.error = null;
    try {
      this.faqs = await firstValueFrom(this.api.getAdminFAQs(this.search, this.category));
      // Extract unique categories
      this.categories = [...new Set(this.faqs.map(faq => faq.category).filter(Boolean))];
    } catch (e: any) {
      this.error = e?.message || 'Failed to fetch FAQs';
    } finally {
      this.loading = false;
    }
  }

  async fetchNotifications() {
    try {
      this.notifications = await firstValueFrom(this.api.getAdminNotifications());
    } catch (e: any) {
      console.error('Failed to fetch notifications:', e);
    }
  }

  async markAllAsRead() {
    try {
      await firstValueFrom(this.api.markAllNotificationsAsRead());
      this.fetchNotifications();
    } catch (e: any) {
      this.error = e?.message || 'Failed to mark notifications as read';
    }
  }

  onSearchChange() {
    this.fetchFAQs();
  }

  onCategoryChange() {
    this.fetchFAQs();
  }

  openCreateModal() {
    this.editingFAQ = null;
    this.form = {
      question: '',
      answer: '',
      category: '',
      is_published: true
    };
    this.showModal = true;
  }

  openEditModal(faq: FAQ) {
    this.editingFAQ = faq;
    this.form = {
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      is_published: faq.is_published
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingFAQ = null;
    this.form = {
      question: '',
      answer: '',
      category: '',
      is_published: true
    };
  }

  async handleSubmit() {
    if (!this.form.question.trim() || !this.form.answer.trim()) {
      this.error = 'Question and answer are required';
      return;
    }

    this.submitting = true;
    this.error = null;

    try {
      if (this.editingFAQ) {
        await firstValueFrom(this.api.updateFAQ(this.editingFAQ.id, this.form));
      } else {
        await firstValueFrom(this.api.createFAQ(this.form));
      }
      
      this.closeModal();
      this.fetchFAQs();
    } catch (e: any) {
      this.error = e?.message || 'Failed to save FAQ';
    } finally {
      this.submitting = false;
    }
  }

  async deleteFAQ(faq: FAQ) {
    if (!confirm(`Are you sure you want to delete "${faq.question}"?`)) {
      return;
    }

    try {
      await firstValueFrom(this.api.deleteFAQ(faq.id));
      this.fetchFAQs();
    } catch (e: any) {
      this.error = e?.message || 'Failed to delete FAQ';
    }
  }

  getStatusColor(isPublished: boolean) {
    return isPublished 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-200 text-gray-600';
  }

  getStatusText(isPublished: boolean) {
    return isPublished ? 'Published' : 'Unpublished';
  }
}
