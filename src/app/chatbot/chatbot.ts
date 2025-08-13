import { Component, OnInit } from '@angular/core';
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
export class ChatbotComponent implements OnInit {
  isOpen = false;
  messages: ChatMessage[] = [];
  inputMessage = '';
  botIconUrl = BOT_ICON_URL;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.messages = [
      { text: "👋 Hi! I'm your i-STOKVEL assistant. How can I help you today?", isUser: false }
    ];
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  async handleSendMessage() {
    if (this.inputMessage.trim()) {
      this.messages.push({ text: this.inputMessage, isUser: true });
      const currentMessage = this.inputMessage;
      this.inputMessage = '';

      try {
        const response = await this.apiService.sendChatMessage(currentMessage).toPromise();
        this.messages.push({
          text: response?.answer || "Sorry, I couldn't get a response.",
          isUser: false
        });
      } catch (err) {
        this.messages.push({
          text: "Sorry, there was an error contacting the AI.",
          isUser: false
        });
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
    if (event.key === 'Enter') {
      this.handleSendMessage();
    }
  }
}
