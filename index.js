const express = require("express");
const { WebSocketServer } = require("ws");
const { SarvamAIClient } = require("sarvamai");
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { createKnowledgeContext } = require('./utils/knowledgeContext');
require('dotenv').config({ path: './.env.local' });

const API_KEY = process.env.API_KEY;
const LLM_API_KEY = process.env.LLM_API_KEY;
const TTS_API_KEY = process.env.TTS_API_KEY;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

const app = express();
const server = require("http").createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://morobuddy.vercel.app"
  ],
  methods: ["GET","POST"]

}));

app.use(express.json());

app.post("/chat", upload.single('audio'), async (req, res) => {
    console.log("Received chat request");

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
                console.log("_____________________SET ONE PASSED _______________________________")
                console.log(`Transcription: ${userMessage}`);
                
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
                 messages: [
                        // {role: "system",content: "You are an AI voice assistant named Moro.Respond to users in a natural, professional, and straightforward manner. Do not use emojis, excessive expressions, or overly casual/friendly language.If a user asks for an introduction, introduce yourself using your name (“Moro”).If the user asks for an introduction for themselves, use their name in the introduction if provided or ask for it if notYou have knowledge of Next Tech Lab AP at SRM University AP. If anyone asks about the lab, respond with accurate information:“Next Tech Lab AP is a student-led research and innovation community at SRM University AP, Amaravati. It focuses on cutting-edge technologies, including artificial intelligence, web development, blockchain, cybersecurity, and mathematical research. The lab organizes hackathons, tech workshops, and collaborates on various technical projects across India, providing students with practical exposure and networking opportunities.”Remain professional and concise in all responses unless instructed otherwise.Mention your own name only when specifically asked, when introducing yourself, or when required for clarity.If a user says hello,  greets you, or asks for an introduction, reply by introducing yourself as Moro and inform them that you were designed and developed by students of Next Tech Lab AP at SRM University AP.",},
                           {role: "system",content: createKnowledgeContext()},
                        { role: "user", content: userMessage }
                        ],
                temperature: 0.5,
                top_p: 1,
                max_tokens: 1000,
            });
           
            // Extract the raw text from the response
            let responseText = llmResponse.choices[0].message.content;

            // Remove <think>...</think> block (including multiline)
            llmOutput = responseText.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

           

            console.log("_____________________SET TWO PASSED _______________________________")
            console.log(`LLM Output: ${llmOutput}`);
        } catch(err) {
            console.error('LLM error:', err);
            return res.status(500).json({ error: "Failed to get LLM response", details: err.message });
        }

        // Convert to speech
        try {
            const client = new SarvamAIClient({apiSubscriptionKey: TTS_API_KEY});
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

wss.on('connection', (ws) => {
    console.log("New client connected");

    // Send welcome message to client
    ws.send("hello hero wel Come to the our server ;)");

    // Buffer to store chunks for this connection
    let audioChunks = [];

    // Listen for audio chunks
    ws.on('message', (data, isBinary) => {
        if (isBinary) {
            console.log("Received audio chunk, size:", data.length, "chunks in array:", audioChunks.length + 1);
            audioChunks[0] = data
        } else {
            console.log("Received text message:", data.toString());
        }
    });


    

    // When client disconnects, save audio and (optionally) transcribe
    ws.on('close', async () => {
        console.log("Client disconnected");
        
    });
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


app.get("/health", (req, res) => {
  res.send("this server is working good!");
})
