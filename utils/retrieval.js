const fs = require("fs");
const path = require("path");
const { getEmbedding } = require("./embedding");
const EMBEDDINGS_PATH = path.join(__dirname, "..", "data","knowledge", "embeddings.json");
let knowledgeBase = null;

function loadKnowledgeBase() {
  if (!knowledgeBase) {
    const raw = fs.readFileSync(EMBEDDINGS_PATH, "utf-8");
    knowledgeBase = JSON.parse(raw);
    console.log(`[retrieval] Loaded ${knowledgeBase.length} chunks into memory`);
  }
  return knowledgeBase;
}
 
function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}


 async function retrieveContext(userQuery, topK = 5) {
  const queryVector = await getEmbedding(userQuery);
  if (!queryVector) {
    console.error("[retrieval] Failed to embed query, returning no context");
    return [];
  }
 
  const chunks = loadKnowledgeBase();
 
  const scored = chunks.map(c => ({
    text: c.text,
    score: cosineSimilarity(queryVector, c.embedding),
  }));
 
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK);
 
  console.log(`[retrieval] Query: "${userQuery}"`);
  top.forEach(t => console.log(`  [${t.score.toFixed(3)}] ${t.text.slice(0, 70)}...`));
  
  return top.map(t => t.text);
}

module.exports = { retrieveContext };