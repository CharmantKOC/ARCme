-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create document_chunks table for RAG system
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  page_number INTEGER,
  content TEXT NOT NULL,
  embedding vector(1536),  -- OpenAI text-embedding-3-small dimensionality
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Indexes for performance
  CONSTRAINT unique_chunk UNIQUE (document_id, chunk_index)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_page_number ON document_chunks(page_number);

-- Create vector similarity search index using ivfflat
-- This enables fast approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
ON document_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Enable full-text search on content
CREATE INDEX IF NOT EXISTS idx_document_chunks_content_fts 
ON document_chunks 
USING gin(to_tsvector('french', content));

-- Function for semantic search with pgvector
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index int,
  page_number int,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.chunk_index,
    dc.page_number,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  FROM document_chunks dc
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get average embedding for a document (useful for document similarity)
CREATE OR REPLACE FUNCTION get_document_avg_embedding(doc_id uuid)
RETURNS vector(1536)
LANGUAGE plpgsql
AS $$
DECLARE
  avg_embedding vector(1536);
BEGIN
  SELECT AVG(embedding)::vector(1536)
  INTO avg_embedding
  FROM document_chunks
  WHERE document_id = doc_id;
  
  RETURN avg_embedding;
END;
$$;

-- Enable Row Level Security
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_chunks
-- Allow all authenticated users to read chunks
CREATE POLICY "Allow read access to all authenticated users"
ON document_chunks
FOR SELECT
TO authenticated
USING (true);

-- Allow users to insert chunks for documents they uploaded
CREATE POLICY "Allow insert for document owners"
ON document_chunks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_chunks.document_id
    AND documents.user_id = auth.uid()
  )
);

-- Allow users to update chunks for documents they uploaded
CREATE POLICY "Allow update for document owners"
ON document_chunks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_chunks.document_id
    AND documents.user_id = auth.uid()
  )
);

-- Allow users to delete chunks for documents they uploaded
CREATE POLICY "Allow delete for document owners"
ON document_chunks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_chunks.document_id
    AND documents.user_id = auth.uid()
  )
);

-- Grant necessary permissions
GRANT ALL ON document_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION match_document_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION get_document_avg_embedding TO authenticated;

-- Create view for document chunks with metadata (useful for joins)
CREATE OR REPLACE VIEW document_chunks_with_metadata AS
SELECT 
  dc.id,
  dc.document_id,
  dc.chunk_index,
  dc.page_number,
  dc.content,
  dc.embedding,
  dc.created_at,
  d.title,
  d.author,
  d.year,
  d.category as domain,
  d.user_id
FROM document_chunks dc
JOIN documents d ON dc.document_id = d.id;

-- Grant select on view
GRANT SELECT ON document_chunks_with_metadata TO authenticated;

-- Add trigger to automatically delete chunks when document is deleted
-- (CASCADE already handles this, but this is for explicit tracking)
CREATE OR REPLACE FUNCTION delete_document_chunks()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM document_chunks WHERE document_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_document_chunks
BEFORE DELETE ON documents
FOR EACH ROW
EXECUTE FUNCTION delete_document_chunks();

-- Add comment for documentation
COMMENT ON TABLE document_chunks IS 'Stores chunked text from PDF documents with vector embeddings for semantic search';
COMMENT ON COLUMN document_chunks.embedding IS 'Vector embedding (1536 dimensions) generated from chunk content using OpenAI text-embedding-3-small';
COMMENT ON FUNCTION match_document_chunks IS 'Performs semantic similarity search using cosine distance on vector embeddings';
