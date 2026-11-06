export const MASTRA_STORAGE_ID = 'mastra-storage';

// Semantic-recall vector index lives in the same Turso database as MASTRA_STORAGE_ID
// (see src/mastra/storage/vector-store.ts) but needs its own Mastra resource id.
export const MASTRA_VECTOR_ID = 'mastra-vector';
