export interface MCQ {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface MCQResponse {
  mcqs: MCQ[];
}
