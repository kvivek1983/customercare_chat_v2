import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PySmartChatService } from '../../../../app/service/py-smart-chat.service';

@Component({
  selector: 'app-chat-gpt',
  standalone: true,
  imports: [NgTemplateOutlet,CommonModule, FormsModule],
  templateUrl: './chat-gpt.component.html',
  styleUrl: './chat-gpt.component.scss'
})
export class ChatGptComponent implements OnInit{

  constructor(private pscs : PySmartChatService) { }

  messages: { sender: string; text: string }[] = [];
  userInput: string = '';

  requestData : any = {};
  responseData : any = {};
  ngOnInit(): void {

  }

  // Mock function to simulate a ChatGPT response

  // Handle sending a message
  sendMessage(): void {
    if (this.userInput.trim()) {
      // Add user message
      this.messages.push({ sender: 'user', text: this.userInput });
      this.getChatGPTResponse(this.userInput);
      // Simulate bot response
      /*const botResponse = 
      setTimeout(() => {
        this.messages.push({ sender: 'bot', text: botResponse });
      }, 1000);
*/
      // Clear the input field
      this.userInput = '';
    }
  }

  getChatGPTResponse(userMessage: string){

    this.requestData = {
      "message" : userMessage
    };

    this.pscs.getChatGPTResponse(this.requestData).subscribe((data : {})=>{
      this.responseData = data;

      this.messages.push({ sender: 'bot', text: this.responseData.reply });

    },error =>{
      console.log("getChatGPTResponse error :",error);
    });
    //return `ChatGPT: I received your message "${userMessage}".`;
  }

}
