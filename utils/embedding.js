const {GoogleGenerativeAI} = require("@google/generative-ai");
require('dotenv').config({path:'../.env/local'});

const GOOGLE_API = process.env.GEMINI_API_KEY;
const OUTPUT_DIMENSIONALITY = 768;

 const getEmbedding = async (text) => {
    const genai = new GoogleGenerativeAI(GOOGLE_API);
    const model = genai.getGenerativeModel({model: "gemini-embedding-001" });
    
    try{
    const result = await model.embedContent({
    content: { parts: [{ text }] },
    outputDimensionality: OUTPUT_DIMENSIONALITY,
  });
    if(result){
        console.log("i got the results bro");
        return result.embedding.values;
    }
    }catch(err){
        console.log(err);
    }
}

module.exports = { getEmbedding };