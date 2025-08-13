import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../api';
import { SafePipe } from '../shared/safe.pipe';

export interface Lesson {
  title: string;
  videoUrl: string;
  content: string;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
  lessons: Lesson[];
  quiz: {
    questions: QuizQuestion[];
  };
  duration: string;
  isLocked?: boolean;
}

export interface CourseCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  courses: Course[];
}

export interface CourseProgress {
  completed: number[];
  lastLesson: number;
}

@Component({
  selector: 'app-learning',
  templateUrl: './learning.html',
  styleUrls: ['./learning.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, SafePipe]
})
export class LearningComponent implements OnInit {
  selectedCategory: string | null = null;
  selectedCourse: string | null = null;
  currentLesson = 0;
  progress: { [key: string]: CourseProgress } = {};
  showQuiz = false;
  quizAnswers: { [key: number]: number } = {};
  quizResult: boolean | null = null;
  showLoader = true;
  searchQuery = '';
  
  Math = Math;

  categories: CourseCategory[] = [
    {
      id: 'financial-literacy',
      name: 'Financial Literacy',
      description: 'Master money management, budgeting, and financial planning',
      icon: '',
      color: 'bg-green-100 text-green-800',
      courses: [
        {
          id: 'budgeting',
          title: 'Budgeting 101',
          description: 'Master the basics of budgeting and take control of your finances.',
          icon: '💳',
          duration: '15 min',
          lessons: [
            {
              title: 'Why Budget?',
              videoUrl: 'https://www.youtube.com/embed/xEPHsUtLFDA?si=87NlK6ZAXsqFkEmM',
              content: 'Learn why budgeting is the foundation of financial success.'
            },
            {
              title: 'How to Track Expenses',
              videoUrl: 'https://www.youtube.com/embed/ZmthxqxuFQI?si=EEB4LR67COwYHO-V',
              content: 'Discover simple ways to track your spending and stay on budget.'
            },
            {
              title: 'Setting Savings Goals',
              videoUrl: 'https://www.youtube.com/embed/Duxo4xXeMec?si=zXCSrtBge_T3TrIA',
              content: 'Set realistic savings goals and achieve them step by step.'
            }
          ],
          quiz: {
            questions: [
              {
                q: 'What is the first step in budgeting?',
                options: ['Set a savings goal', 'List income and expenses', 'Track investments', 'Pay off debt'],
                answer: 1
              },
              {
                q: 'Why is it important to track your expenses?',
                options: ['To impress friends', 'To control spending', 'To get a loan', 'To pay more tax'],
                answer: 1
              }
            ]
          }
        },
        {
          id: 'credit',
          title: 'Building Credit',
          description: 'Understand credit, loans, and how to build a strong credit score.',
          icon: '🏦',
          duration: '12 min',
          lessons: [
            {
              title: 'How Credit Works',
              videoUrl: 'https://www.youtube.com/embed/f2ortkJfTKw?si=HULnJ6W2nePkjE8a',
              content: 'Get the basics of credit and why it matters.'
            },
            {
              title: 'Tips for Good Credit',
              videoUrl: 'https://www.youtube.com/embed/NcX0k2FiF2g?si=DCJna0UsnAWjnSTY',
              content: 'Practical tips to build and maintain a healthy credit score.'
            }
          ],
          quiz: {
            questions: [
              {
                q: 'What helps build a good credit score?',
                options: ['Paying bills late', 'Maxing out credit cards', 'Paying on time', 'Ignoring your credit report'],
                answer: 2
              }
            ]
          }
        },
        {
          id: 'saving',
          title: 'Smart Saving',
          description: 'Learn strategies to save more and reach your financial goals faster.',
          icon: '🐷',
          duration: '10 min',
          lessons: [
            {
              title: 'Why Save?',
              videoUrl: 'https://www.youtube.com/embed/JqYoLQXO7j4?si=yUqtDei4os8LFy_Q',
              content: 'Understand the importance of saving for emergencies and future goals.'
            },
            {
              title: 'Automating Your Savings',
              videoUrl: 'https://www.youtube.com/embed/H-YT783ftGM?si=dguTbDD9pu0zsxDM',
              content: 'How to set up automatic savings and make it a habit.'
            }
          ],
          quiz: {
            questions: [
              {
                q: 'What is a good reason to save money?',
                options: ['To buy unnecessary things', 'For emergencies and future goals', 'To lend to friends', 'To avoid budgeting'],
                answer: 1
              }
            ]
          }
        },
        {
          id: 'investing',
          title: 'Investing Basics',
          description: 'A beginner\'s guide to investing and wealth building.',
          icon: '📈',
          duration: '20 min',
          isLocked: true,
          lessons: [
            {
              title: 'What is Investing?',
              videoUrl: 'https://www.youtube.com/embed/xBq2dO8GHVE?si=KAQn5PHvu_Kkeo-P',
              content: 'Learn the basics of investing and why it\'s important for wealth building.'
            },
            {
              title: 'Types of Investments',
              videoUrl: 'https://www.youtube.com/embed/3I8lrwq1FVg?si=84gDgnTaj_0jNhVD',
              content: 'Explore different investment options and their risk levels.'
            },
            {
              title: 'Getting Started',
              videoUrl: 'https://www.youtube.com/embed/xBq2dO8GHVE?si=KAQn5PHvu_Kkeo-P',
              content: 'Step-by-step guide to making your first investment.'
            }
          ],
          quiz: {
            questions: [
              {
                q: 'What is the first step to start investing?',
                options: ['Open an account', 'Buy stocks immediately', 'Withdraw money', 'Close your bank account'],
                answer: 0
              }
            ]
          }
        }
      ]
    },
    {
      id: 'soft-skills',
      name: 'Soft Skills',
      description: 'Develop communication, leadership, and interpersonal skills',
      icon: '🗣️',
      color: 'bg-blue-100 text-blue-800',
      courses: [
        {
          id: 'communication',
          title: 'Effective Communication',
          description: 'Learn to communicate clearly and confidently in any situation.',
          icon: '💬',
          duration: '18 min',
          lessons: [
            {
              title: 'Communication Basics',
              videoUrl: 'https://www.youtube.com/embed/xEPHsUtLFDA?si=87NlK6ZAXsqFkEmM',
              content: 'Understanding the fundamentals of effective communication.'
            },
            {
              title: 'Active Listening',
              videoUrl: 'https://www.youtube.com/embed/ZmthxqxuFQI?si=EEB4LR67COwYHO-V',
              content: 'Master the art of active listening and understanding others.'
            }
          ],
          quiz: {
            questions: [
              {
                q: 'What is active listening?',
                options: ['Talking a lot', 'Paying full attention', 'Interrupting others', 'Avoiding eye contact'],
                answer: 1
              }
            ]
          }
        },
        {
          id: 'time-management',
          title: 'Time Management',
          description: 'Master productivity and time organization techniques.',
          icon: '⏰',
          duration: '15 min',
          lessons: [
            {
              title: 'Prioritization Techniques',
              videoUrl: 'https://www.youtube.com/embed/Duxo4xXeMec?si=zXCSrtBge_T3TrIA',
              content: 'Learn how to prioritize tasks effectively.'
            },
            {
              title: 'Time Blocking',
              videoUrl: 'https://www.youtube.com/embed/JqYoLQXO7j4?si=yUqtDei4os8LFy_Q',
              content: 'Organize your day with time blocking strategies.'
            }
          ],
          quiz: {
            questions: [
              {
                q: 'What is time blocking?',
                options: ['Working all day', 'Scheduling specific time for tasks', 'Avoiding work', 'Taking breaks'],
                answer: 1
              }
            ]
          }
        },
        {
          id: 'leadership',
          title: 'Leadership Skills',
          description: 'Develop leadership qualities and team management skills.',
          icon: '👑',
          duration: '25 min',
          lessons: [
            {
              title: 'Leadership Fundamentals',
              videoUrl: 'https://www.youtube.com/embed/f2ortkJfTKw?si=HULnJ6W2nePkjE8a',
              content: 'Understanding what makes a great leader.'
            },
            {
              title: 'Team Building',
              videoUrl: 'https://www.youtube.com/embed/NcX0k2FiF2g?si=DCJna0UsnAWjnSTY',
              content: 'Building and motivating effective teams.'
            }
          ],
          quiz: {
            questions: [
              {
                q: 'What is a key leadership quality?',
                options: ['Being bossy', 'Empowering others', 'Working alone', 'Avoiding decisions'],
                answer: 1
              }
            ]
          }
        }
      ]
    },
    {
      id: 'digital-skills',
      name: 'Digital Skills',
      description: 'Master technology and online tools for success',
      icon: '',
      color: 'bg-purple-100 text-purple-800',
      courses: [
        {
          id: 'computer-basics',
          title: 'Basic Computer Skills',
          description: 'Essential computer skills for everyday use.',
          icon: '🖥️',
          duration: '20 min',
          lessons: [
            {
              title: 'Computer Fundamentals',
              videoUrl: 'https://www.youtube.com/embed/xEPHsUtLFDA?si=87NlK6ZAXsqFkEmM',
              content: 'Understanding basic computer operations and software.'
            },
            {
              title: 'Internet Safety',
              videoUrl: 'https://www.youtube.com/embed/ZmthxqxuFQI?si=EEB4LR67COwYHO-V',
              content: 'Staying safe online and protecting your information.'
            }
          ],
          quiz: {
            questions: [
              {
                q: 'What should you do to stay safe online?',
                options: ['Share passwords', 'Use strong passwords', 'Click all links', 'Ignore updates'],
                answer: 1
              }
            ]
          }
        },
        {
          id: 'social-media',
          title: 'Social Media Marketing',
          description: 'Learn to use social media for business and personal branding.',
          icon: '📱',
          duration: '22 min',
          lessons: [
            {
              title: 'Platform Overview',
              videoUrl: 'https://www.youtube.com/embed/Duxo4xXeMec?si=zXCSrtBge_T3TrIA',
              content: 'Understanding different social media platforms.'
            },
            {
              title: 'Content Strategy',
              videoUrl: 'https://www.youtube.com/embed/JqYoLQXO7j4?si=yUqtDei4os8LFy_Q',
              content: 'Creating engaging content for your audience.'
            }
          ],
          quiz: {
            questions: [
              {
                q: 'What is content strategy?',
                options: ['Posting randomly', 'Planning what to share', 'Ignoring followers', 'Deleting posts'],
                answer: 1
              }
            ]
          }
        }
      ]
    },
    {
      id: 'business-skills',
      name: 'Business Skills',
      description: 'Develop entrepreneurial and business management skills',
      icon: '',
      color: 'bg-orange-100 text-orange-800',
      courses: [
        {
          id: 'entrepreneurship',
          title: 'Entrepreneurship Basics',
          description: 'Start your journey as an entrepreneur.',
          icon: '🚀',
          duration: '30 min',
          lessons: [
            {
              title: 'What is Entrepreneurship?',
              videoUrl: 'https://www.youtube.com/embed/f2ortkJfTKw?si=HULnJ6W2nePkjE8a',
              content: 'Understanding the fundamentals of entrepreneurship.'
            },
            {
              title: 'Business Planning',
              videoUrl: 'https://www.youtube.com/embed/NcX0k2FiF2g?si=DCJna0UsnAWjnSTY',
              content: 'Creating a solid business plan for your venture.'
            }
          ],
          quiz: {
            questions: [
              {
                q: 'What is a business plan?',
                options: ['A random idea', 'A detailed roadmap', 'A wish list', 'A dream'],
                answer: 1
              }
            ]
          }
        },
        {
          id: 'customer-service',
          title: 'Customer Service Excellence',
          description: 'Master the art of exceptional customer service.',
          icon: '🎯',
          duration: '18 min',
          lessons: [
            {
              title: 'Customer Service Principles',
              videoUrl: 'https://www.youtube.com/embed/xEPHsUtLFDA?si=87NlK6ZAXsqFkEmM',
              content: 'Core principles of excellent customer service.'
            },
            {
              title: 'Handling Difficult Customers',
              videoUrl: 'https://www.youtube.com/embed/ZmthxqxuFQI?si=EEB4LR67COwYHO-V',
              content: 'Strategies for managing challenging customer situations.'
            }
          ],
          quiz: {
            questions: [
              {
                q: 'What is the key to good customer service?',
                options: ['Ignoring complaints', 'Listening to customers', 'Being rude', 'Avoiding contact'],
                answer: 1
              }
            ]
          }
        }
      ]
    },
    {
      id: 'personal-development',
      name: 'Personal Development',
      description: 'Build confidence, resilience, and personal growth',
      icon: '',
      color: 'bg-pink-100 text-pink-800',
      courses: [
        {
          id: 'goal-setting',
          title: 'Goal Setting & Achievement',
          description: 'Learn to set and achieve meaningful goals.',
          icon: '🎯',
          duration: '16 min',
          lessons: [
            {
              title: 'SMART Goals',
              videoUrl: 'https://www.youtube.com/embed/Duxo4xXeMec?si=zXCSrtBge_T3TrIA',
              content: 'Setting Specific, Measurable, Achievable, Relevant, and Time-bound goals.'
            },
            {
              title: 'Goal Achievement Strategies',
              videoUrl: 'https://www.youtube.com/embed/JqYoLQXO7j4?si=yUqtDei4os8LFy_Q',
              content: 'Practical strategies to achieve your goals.'
            }
          ],
          quiz: {
            questions: [
              {
                q: 'What does SMART stand for in goal setting?',
                options: ['Simple, Meaningful, Achievable, Realistic, Timely', 'Specific, Measurable, Achievable, Relevant, Time-bound', 'Smart, Measurable, Attainable, Relevant, Timely', 'Simple, Measurable, Achievable, Realistic, Time-bound'],
                answer: 1
              }
            ]
          }
        },
        {
          id: 'confidence',
          title: 'Building Confidence',
          description: 'Develop self-confidence and overcome self-doubt.',
          icon: '💪',
          duration: '20 min',
          lessons: [
            {
              title: 'Understanding Confidence',
              videoUrl: 'https://www.youtube.com/embed/f2ortkJfTKw?si=HULnJ6W2nePkjE8a',
              content: 'What confidence is and why it matters.'
            },
            {
              title: 'Confidence Building Techniques',
              videoUrl: 'https://www.youtube.com/embed/NcX0k2FiF2g?si=DCJna0UsnAWjnSTY',
              content: 'Practical techniques to build your confidence.'
            }
          ],
          quiz: {
            questions: [
              {
                q: 'How can you build confidence?',
                options: ['Avoid challenges', 'Practice and preparation', 'Stay in comfort zone', 'Ignore feedback'],
                answer: 1
              }
            ]
          }
        },
        {
          id: 'stress-management',
          title: 'Stress Management',
          description: 'Learn effective techniques to manage stress and anxiety.',
          icon: '🧘',
          duration: '18 min',
          lessons: [
            {
              title: 'Understanding Stress',
              videoUrl: 'https://www.youtube.com/embed/xEPHsUtLFDA?si=87NlK6ZAXsqFkEmM',
              content: 'What stress is and how it affects us.'
            },
            {
              title: 'Stress Relief Techniques',
              videoUrl: 'https://www.youtube.com/embed/ZmthxqxuFQI?si=EEB4LR67COwYHO-V',
              content: 'Practical techniques to reduce and manage stress.'
            }
          ],
          quiz: {
            questions: [
              {
                q: 'What is a good stress management technique?',
                options: ['Avoiding all problems', 'Deep breathing exercises', 'Working more hours', 'Ignoring stress'],
                answer: 1
              }
            ]
          }
        }
      ]
    },
    {
      id: 'wellness-health',
      name: 'Wellness & Health',
      description: 'Improve physical and mental well-being',
      icon: '',
      color: 'bg-teal-100 text-teal-800',
      courses: [
        {
          id: 'mental-health',
          title: 'Mental Health Awareness',
          description: 'Understanding and maintaining good mental health.',
          icon: '🧠',
          duration: '25 min',
          lessons: [
            {
              title: 'Mental Health Basics',
              videoUrl: 'https://www.youtube.com/embed/Duxo4xXeMec?si=zXCSrtBge_T3TrIA',
              content: 'Understanding mental health and its importance.'
            },
            {
              title: 'Self-Care Strategies',
              videoUrl: 'https://www.youtube.com/embed/JqYoLQXO7j4?si=yUqtDei4os8LFy_Q',
              content: 'Practical self-care strategies for mental well-being.'
            }
          ],
          quiz: {
            questions: [
              {
                q: 'What is self-care?',
                options: ['Being selfish', 'Taking care of your needs', 'Ignoring others', 'Avoiding responsibilities'],
                answer: 1
              }
            ]
          }
        },
        {
          id: 'nutrition',
          title: 'Nutrition Fundamentals',
          description: 'Learn about healthy eating and nutrition basics.',
          icon: '🥗',
          duration: '22 min',
          lessons: [
            {
              title: 'Nutrition Basics',
              videoUrl: 'https://www.youtube.com/embed/f2ortkJfTKw?si=HULnJ6W2nePkjE8a',
              content: 'Understanding the basics of nutrition and healthy eating.'
            },
            {
              title: 'Meal Planning',
              videoUrl: 'https://www.youtube.com/embed/NcX0k2FiF2g?si=DCJna0UsnAWjnSTY',
              content: 'How to plan and prepare healthy meals.'
            }
          ],
          quiz: {
            questions: [
              {
                q: 'What is a balanced meal?',
                options: ['Only protein', 'Only carbs', 'A mix of nutrients', 'Only vegetables'],
                answer: 2
              }
            ]
          }
        }
      ]
    }
  ];

  constructor(
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.loadProgress();
    this.showLoader = true;
    setTimeout(() => {
      this.showLoader = false;
    }, 2000);
  }

  loadProgress() {
    const saved = localStorage.getItem('courseProgress');
    if (saved) {
      this.progress = JSON.parse(saved);
    }
  }

  saveProgress() {
    localStorage.setItem('courseProgress', JSON.stringify(this.progress));
  }

  selectCategory(categoryId: string) {
    this.selectedCategory = categoryId;
    this.selectedCourse = null;
    this.currentLesson = 0;
    this.showQuiz = false;
    this.quizResult = null;
  }

  selectCourse(courseId: string) {
    this.selectedCourse = courseId;
    this.currentLesson = this.progress[courseId]?.lastLesson || 0;
    this.showQuiz = false;
    this.quizResult = null;
  }

  backToCategories() {
    this.selectedCategory = null;
    this.selectedCourse = null;
    this.currentLesson = 0;
    this.showQuiz = false;
    this.quizResult = null;
  }

  backToCatalog() {
    this.selectedCourse = null;
    this.currentLesson = 0;
    this.showQuiz = false;
    this.quizResult = null;
  }

  selectLesson(index: number) {
    this.currentLesson = index;
    this.showQuiz = false;
    this.quizResult = null;
  }

  completeLesson() {
    if (!this.selectedCourse) return;
    
    const course = this.getCurrentCourse()!;
    const newProgress = {
      ...this.progress,
      [this.selectedCourse]: {
        completed: [
          ...(this.progress[this.selectedCourse]?.completed || []),
          this.currentLesson
        ],
        lastLesson: Math.min(this.currentLesson + 1, course.lessons.length - 1)
      }
    };
    
    this.progress = newProgress;
    this.saveProgress();
    
    if (this.currentLesson < course.lessons.length - 1) {
      this.currentLesson++;
    } else {
      this.showQuiz = true;
    }
  }

  submitQuiz() {
    if (!this.selectedCourse) return;
    
    const course = this.getCurrentCourse()!;
    const correct = course.quiz.questions.every(
      (q, idx) => this.quizAnswers[idx] === q.answer
    );
    this.quizResult = correct;
  }

  getCategoryProgress(categoryId: string): number {
    const category = this.categories.find(c => c.id === categoryId);
    if (!category) return 0;
    
    const totalCourses = category.courses.length;
    const completedCourses = category.courses.filter(course => 
      this.getCourseProgress(course.id) === 100
    ).length;
    
    return Math.round((completedCourses / totalCourses) * 100);
  }

  getCategoryCompletedCourses(categoryId: string): number {
    const category = this.categories.find(c => c.id === categoryId);
    if (!category) return 0;
    
    return category.courses.filter(course => 
      this.getCourseProgress(course.id) === 100
    ).length;
  }

  getCourseProgress(courseId: string): number {
    const course = this.getAllCourses().find(c => c.id === courseId);
    if (!course) return 0;
    
    const completed = this.progress[courseId]?.completed?.length || 0;
    return Math.round((completed / course.lessons.length) * 100);
  }

  getCompletedLessons(courseId: string): number {
    return this.progress[courseId]?.completed?.length || 0;
  }

  isLessonCompleted(lessonIndex: number): boolean {
    if (!this.selectedCourse) return false;
    return this.progress[this.selectedCourse]?.completed?.includes(lessonIndex) || false;
  }

  getCurrentCategory(): CourseCategory | undefined {
    return this.categories.find(c => c.id === this.selectedCategory);
  }

  getCurrentCourse(): Course | undefined {
    if (!this.selectedCourse) return undefined;
    return this.getAllCourses().find(c => c.id === this.selectedCourse);
  }

  getAllCourses(): Course[] {
    return this.categories.flatMap(category => category.courses);
  }

  getCurrentLesson(): Lesson | undefined {
    const course = this.getCurrentCourse();
    return course?.lessons[this.currentLesson];
  }

  getCurrentLessonCount(): number {
    const course = this.getCurrentCourse();
    return course?.lessons.length || 0;
  }

  getCurrentQuizQuestions(): QuizQuestion[] {
    const course = this.getCurrentCourse();
    return course?.quiz.questions || [];
  }

  getCurrentLessonVideoUrl(): string {
    const lesson = this.getCurrentLesson();
    return lesson?.videoUrl || '';
  }

  getTotalProgress(): number {
    const allCourses = this.getAllCourses();
    const totalCourses = allCourses.length;
    const completedCourses = allCourses.filter(course => 
      this.getCourseProgress(course.id) === 100
    ).length;
    
    return Math.round((completedCourses / totalCourses) * 100);
  }

  getTotalCompletedCourses(): number {
    return this.getAllCourses().filter(course => 
      this.getCourseProgress(course.id) === 100
    ).length;
  }

  getTotalCourses(): number {
    return this.getAllCourses().length;
  }

  getCategoryCoursesCount(categoryId: string): number {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.courses.length || 0;
  }

  onSearch() {
    // Implement search functionality
    console.log('Searching for:', this.searchQuery);
  }

  getInProgressCourses(): Course[] {
    return this.getAllCourses().filter(course => 
      this.getCourseProgress(course.id) > 0 && this.getCourseProgress(course.id) < 100
    ).slice(0, 3);
  }

  getFeaturedCourses(): Course[] {
    // Return a mix of courses from different categories
    const featured: Course[] = [];
    
    this.categories.forEach(category => {
      const randomCourse = category.courses[Math.floor(Math.random() * category.courses.length)];
      if (randomCourse && !featured.find(f => f.id === randomCourse.id)) {
        featured.push(randomCourse);
      }
    });
    
    return featured.slice(0, 4);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  goToPreviousLesson() {
    this.currentLesson = Math.max(0, this.currentLesson - 1);
  }

  isLastLesson(): boolean {
    const course = this.getCurrentCourse();
    return this.currentLesson === (course?.lessons.length || 0) - 1;
  }

  getCurrentCategoryCoursesCount(): number {
    const category = this.getCurrentCategory();
    return category?.courses.length || 0;
  }
}
