export type Project = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectPayload = {
  name: string;
  description?: string | null;
};
