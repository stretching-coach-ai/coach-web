export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

export interface ChatInterfaceProps {
  sessionId: string;
  initialMessages?: Message[];
  onSendMessage: (message: string) => void;
}

export interface ChatResponse {
  response: string;
  sessionId: string;
} 