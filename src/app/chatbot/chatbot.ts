import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api';

const BOT_ICON_URL = "https://png.pngtree.com/png-clipart/20230401/original/pngtree-smart-chatbot-cartoon-clipart-png-image_9015126.png";

interface ChatMessage {
  text: string;
  isUser: boolean;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  isOpen = false;
  messages: ChatMessage[] = [];
  inputMessage = '';
  botIconUrl = BOT_ICON_URL;
  isLoading = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.messages = [
      { text: "👋 Hi! I'm your i-STOKVEL assistant. How can I help you today?", isUser: false }
    ];
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  async handleSendMessage() {
    if (this.inputMessage.trim() && !this.isLoading) {
      const userMessage = this.inputMessage.trim();
      this.messages.push({ text: userMessage, isUser: true });
      this.inputMessage = '';
      this.isLoading = true;

      try {
        console.log('Sending message to backend:', userMessage);
        const response = await this.apiService.sendChatMessage(userMessage).toPromise();
        console.log('Backend response:', response);
        
        if (response && response.answer) {
          this.messages.push({
            text: response.answer,
            isUser: false
          });
        } else {
          this.messages.push({
            text: "Sorry, I couldn't get a response. Please try again.",
            isUser: false
          });
        }
      } catch (err: any) {
        console.error('Chat error:', err);
        
        // Provide more specific error messages
        let errorMessage = "Sorry, there was an error contacting the AI. Please try again.";
        
        if (err.status === 500) {
          errorMessage = "The AI service is currently unavailable. Please try again later.";
        } else if (err.status === 400) {
          errorMessage = "Invalid request. Please check your message and try again.";
        } else if (err.status === 0) {
          errorMessage = "Cannot connect to the server. Please check your internet connection.";
        }
        
        this.messages.push({
          text: errorMessage,
          isUser: false
        });
      } finally {
        this.isLoading = false;
      }
    }
  }

  handleClearMessages() {
    this.messages = [];
    setTimeout(() => {
      this.messages = [{ text: "👋 Hi! I'm your i-STOKVEL assistant. How can I help you today?", isUser: false }];
    }, 100);
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSendMessage();
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      // Handle scroll error
    }
  }
}
