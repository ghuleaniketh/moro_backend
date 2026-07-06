const express = require("express");
const { SarvamAIClient } = require("sarvamai");
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { createKnowledgeContext } = require('./utils/knowledgeContext');
require('dotenv').config({ path: './.env.local' });
const {retrieveContext} = require('./utils/retrieval');
const API_KEY = process.env.API_KEY;
const LLM_API_KEY = process.env.LLM_API_KEY;
const TTS_API_KEY = process.env.TTS_API_KEY;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });
const app = express();
const server = require("http").createServer(app);

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://morobuddy.vercel.app"
  ],
  methods: ["GET","POST"]
}));

app.use(express.json());


app.get("/health", (req, res) => {
    console.log("tabiyat theek hai hamari bhaiya");
    res.json({ status: "ok" });
});


app.post("/chat", upload.single('audio'), async (req, res) => {
    console.log("Received chat request");
    let systemPrompt = "";
    try {
        let userMessage = req.body.message; 
        // If audio file is provided, transcribe it first
        if (req.file) {
            console.log("Processing audio file:", req.file.path);
            
            if(!API_KEY){
                console.error("the api key is having some issue please check the key and try again");
                return res.status(500).json({ error: "API key not set" });
            }else{
                console.log("API Key is set, proceeding with STT transcription");
            }
            try {
                const client = new SarvamAIClient({ apiSubscriptionKey: API_KEY });
                const audioFile = fs.createReadStream(req.file.path);
                const sttResponse = await client.speechToText.transcribe({
                    file: audioFile,
                    language_code: "en-IN",
                    model: "saarika:v2.5"
                });
                console.log("STT Response:", JSON.stringify(sttResponse, null, 2));
                userMessage = sttResponse.transcript;
                if(!userMessage){
                    console.log("Aapke baat nahi pahuci yaha pe bhaiya");
                }
                const embedding = await retrieveContext(userMessage, 5);

                console.log(embedding);
                console.log("_____________________SET ONE PASSED _______________________________")
                console.log(typeof embedding);
                systemPrompt = `You are Moro, a helpful assistant for Next Tech Lab AP, developed by the developers of Next Tech Lab.
                                    Answer the user's question directly using the context given to you. Be specific and use the actual facts given .
                                    Context:
                                    ${embedding}`;



                // Clean up uploaded file
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error('STT error:', err);
                fs.unlinkSync(req.file.path);
                return res.status(500).json({ error: "Failed to transcribe audio", details: err.message });
            }
        }

        if (!userMessage) {
            return res.status(400).json({ error: "Message or audio is required" });
        }

        if(LLM_API_KEY){
            console.log("LLM API Key is set, proceeding with LLM response generation");
        }else{
            console.error("the api LLM key is having some issue please check the key and try again");
        }
        // Get LLM response
        let llmOutput = "";
        try {
            const client = new SarvamAIClient({apiSubscriptionKey: LLM_API_KEY});
            const llmResponse = await client.chat.completions({
                model: "sarvam-105b",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ]

            });
           
            let responseText = llmResponse.choices[0].message.content.replace(/\*\*(.*?)\*\*/g, "$1")
                        .replace(/\*(.*?)\*/g, "$1")
                        .replace(/^[\s]*[\*\-]\s+/gm, "")
                        .replace(/#{1,6}\s?/g, "")
                        .replace(/`([^`]*)`/g, "$1")
                        .replace(/\n{2,}/g, ". ")
                        .replace(/\n/g, " ")
                        .trim();

            llmOutput = responseText;
                        

           

            console.log("_____________________SET TWO PASSED _______________________________")
            console.log(`LLM Output: ${llmOutput}`);
        } catch(err) {
            console.error('LLM error:', err);
            return res.status(500).json({ error: "Failed to get LLM response", details: err.message });
        }

        // Convert to speech
        try {
            const client = new SarvamAIClient({apiSubscriptionKey: API_KEY});
            const ttsResponse = await client.textToSpeech.convert({
                text: llmOutput,
                target_language_code: "hi-IN",
                speaker: "shubh",
                pace: 1.1,
                speech_sample_rate: 22050,
                enable_preprocessing: true,
                model: "bulbul:v3-beta",
                temperature: 0.6

            });
            console.log("_____________________SET THREE PASSED _______________________________")
            console.log("TTS conversion complete and  been sent to the client");
            res.json({ 
                status: "success", 
                transcript: userMessage,
                response: llmOutput,
                audioBase64: ttsResponse 
            });
        } catch(err) {
            console.error('TTS error:', err);
            // Return text response even if TTS fails
            res.json({ 
                status: "partial_success", 
                transcript: userMessage,
                response: llmOutput,
                error: "TTS conversion failed" 
            });
        }
    } catch(err) {
        console.error('Chat error:', err);
        res.status(500).json({ error: "Failed to process request", details: err.message });
    }
});

app.get("/", (req, res) => {
    res.send("Welcome to Home Page");
});

server.listen(8080, () => {
    console.log(`server is running on port 8080`);
});

const callClient = (ttsOutput) => {
    app.get("/voice", (req, res) => {
        if(!ttsOutput){
            setTimeout(() => {
                console.log("data is processing wait a moment");
            }, 2000);
        }else{
            console.log(`Sending data to Client ${ttsOutput}`);
            res.json({ status: "done", audioBase64: ttsOutput });
            ttsOutput = null; 
        }
        callClient(ttsOutput);
    });
}

