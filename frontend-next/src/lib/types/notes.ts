export interface Note {
  id: number;
  title: string;
  content: string;
  category: string;
}

export interface NoteCreate {
  title: string;
  content: string;
  category?: string;
}

export interface NoteUpdate {
  title: string;
  content: string;
  category?: string;
}

export interface NoteActionResponse {
  message: string;
  note_id: number;
}
