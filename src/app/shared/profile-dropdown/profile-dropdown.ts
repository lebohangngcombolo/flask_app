import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth';
import { ApiService } from '../../api';
import { environment } from '../../../environments/environment';

interface User {
  name?: string;
  email?: string;
  profilePicture?: string;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
}

interface Filter {
  name: string;
  label: string;
}

@Component({
  selector: 'app-profile-dropdown',
  templateUrl: './profile-dropdown.html',
  styleUrls: ['./profile-dropdown.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ProfileDropdownComponent implements OnInit, OnDestroy {
  @Input() user: User | null = null;
  @Output() profileUpdated = new EventEmitter<void>();

  // Add document property to fix template error
  document = document;

  isOpen = false;
  notifications: NotificationSettings = {
    email: true,
    push: false
  };
  isUploading = false;
  previewUrl: string | null = null;
  showUploadModal = false;
  uploadStep: 'select' | 'edit' | 'complete' = 'select';
  selectedFilter = 'none';
  selectedFile: File | null = null;

  filters: Filter[] = [
    { name: 'none', label: 'Original' },
    { name: 'vintage', label: 'Vintage' },
    { name: 'grayscale', label: 'Grayscale' },
    { name: 'warm', label: 'Warm' },
    { name: 'cool', label: 'Cool' },
    { name: 'dramatic', label: 'Dramatic' }
  ];

  private backendUrl = environment.apiUrl;

  constructor(
    private router: Router,
    private authService: AuthService,
    private elementRef: ElementRef,
    private api: ApiService
  ) {}

  ngOnInit() {}

  ngOnDestroy() {
    document.removeEventListener('mousedown', this.handleClickOutside.bind(this));
  }

  @HostListener('document:mousedown', ['$event'])
  handleClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  handleProfilePictureClick() {
    this.showUploadModal = true;
    this.uploadStep = 'select';
  }

  onFileChange(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onloadend = () => {
        this.previewUrl = reader.result as string;
        this.uploadStep = 'edit';
      };
      reader.readAsDataURL(file);
    }
  }

  handleNotificationToggle(type: 'email' | 'push') {
    this.notifications[type] = !this.notifications[type];
  }

  handleLogout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  async handleUpload() {
    if (!this.selectedFile) return;
    
    this.isUploading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    
    try {
      const data = await this.api.uploadProfilePicture(this.selectedFile).toPromise();
      if (data?.profile_picture) {
        // brief delay for UX
        await new Promise(res => setTimeout(res, 1000));
        this.uploadStep = 'complete';
        this.profileUpdated.emit();
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      this.isUploading = false;
    }
  }

  setTheme(theme: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }

  getCurrentTheme(): 'light' | 'dark' {
    return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.uploadStep = 'select';
    this.selectedFile = null;
    this.previewUrl = null;
  }

  getProfilePictureUrl(picture: string | undefined): string {
    if (!picture) return '/default-avatar.png';
    // When using proxy, backend returns relative path like /uploads/...
    return picture.startsWith('http') ? picture : `${picture}`;
  }
}
