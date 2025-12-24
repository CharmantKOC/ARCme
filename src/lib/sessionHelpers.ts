import { supabase } from '@/integrations/supabase/client';

export interface ResearchSession {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  document_ids: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const createSession = async (userId: string, title: string, description?: string) => {
  const { data, error } = await supabase
    .from('research_sessions')
    .insert({
      user_id: userId,
      title,
      description: description || null,
      document_ids: [],
      notes: null
    })
    .select()
    .single();

  if (error) throw error;
  return data as ResearchSession;
};

export const getUserSessions = async (userId: string) => {
  const { data, error } = await supabase
    .from('research_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data as ResearchSession[];
};

export const updateSession = async (
  sessionId: string,
  updates: Partial<Omit<ResearchSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
) => {
  const { data, error } = await supabase
    .from('research_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data as ResearchSession;
};

export const deleteSession = async (sessionId: string) => {
  const { error } = await supabase
    .from('research_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
};

export const addDocumentToSession = async (sessionId: string, documentId: string) => {
  // First get the current session
  const { data: session, error: fetchError } = await supabase
    .from('research_sessions')
    .select('document_ids')
    .eq('id', sessionId)
    .single();

  if (fetchError) throw fetchError;

  const currentIds = session.document_ids || [];
  if (currentIds.includes(documentId)) {
    return; // Already added
  }

  const { error } = await supabase
    .from('research_sessions')
    .update({ document_ids: [...currentIds, documentId] })
    .eq('id', sessionId);

  if (error) throw error;
};
