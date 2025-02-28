export interface Message {
  id: number;
  text: string | any;
  sender: 'user' | 'bot';
  isSignupPrompt?: boolean;
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