export type NoteVisibility = 'private' | 'shared' | 'public';

export interface User {
  id: string;
  email: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags_list: string[];
  visibility: NoteVisibility;
  created_at: string;
  updated_at: string;
  public_token?: string | null;
  author_email?: string;
}

export interface SharedNote {
  id: string;
  note: Note;
  shared_at: string;
  shared_by_email?: string;
  shared_with_email?: string;
}

export interface NoteFormData {
  title: string;
  content: string;
  tags_list: string[];
  visibility: NoteVisibility;
}

export interface NoteFilters {
  status?: NoteVisibility;
  search?: string;
  tag?: string;
}