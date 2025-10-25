const express = require("express");
const { WebSocketServer } = require("ws");
const { SarvamAIClient } = require("sarvamai");
const fs = require('fs');
const cors = require('cors');



const app = express();
const server = require("http").createServer(app);
const wss = new WebSocketServer({ server });


app.use(cors({ origin: 'http://localhost:3000' })); 

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
        if (audioChunks.length > 0) {
            const filename = `audio_${Date.now()}.webm`;
            fs.writeFileSync(filename, Buffer.concat(audioChunks));
            console.log('Saved audio:', filename);

            // Transcribe with SarvamAI (pseudo-code, fill in with your API key and logic)
            let sttOutput = "";
            try {
                const client = new SarvamAIClient({ apiSubscriptionKey: API_KEY });
                const audioFile = fs.createReadStream(filename);
                const response = await client.speechToText.transcribe({
                    file: audioFile,
                    language_code: "en-IN",
                    model: "saarika:v2.5"
                });
                console.log(`${response.transcript}`);
                sttOutput = response.transcript;

            } catch (err) {
                console.error('SarvamAI error:', err);
            }
        console.log(`Transcription complete : ${sttOutput}` );


        //this is the llm call point
            let prompt = sttOutput;
            let llmOutput = "";
            try{
                const client = new SarvamAIClient({apiSubscriptionKey: LLM_API_KEY});
                    const response = await client.chat.completions({
                        messages: [
                        {role: "system",content: "You are an AI voice assistant named Moro.Respond to users in a natural, professional, and straightforward manner. Do not use emojis, excessive expressions, or overly casual/friendly language.If a user asks for an introduction, introduce yourself using your name (“Moro”).If the user asks for an introduction for themselves, use their name in the introduction if provided or ask for it if notYou have knowledge of Next Tech Lab AP at SRM University AP. If anyone asks about the lab, respond with accurate information:“Next Tech Lab AP is a student-led research and innovation community at SRM University AP, Amaravati. It focuses on cutting-edge technologies, including artificial intelligence, web development, blockchain, cybersecurity, and mathematical research. The lab organizes hackathons, tech workshops, and collaborates on various technical projects across India, providing students with practical exposure and networking opportunities.”Remain professional and concise in all responses unless instructed otherwise.Mention your own name only when specifically asked, when introducing yourself, or when required for clarity.If a user says hello,  greets you, or asks for an introduction, reply by introducing yourself as Moro and inform them that you were designed and developed by students of Next Tech Lab AP at SRM University AP.",},
                        { role: "user", content: prompt }
                        ],
                        temperature: 0.5,
                        top_p: 1,
                        max_tokens: 1000,
                    });
                    // Log the assistant's reply
                    console.log(response.choices[0].message.content);
                    llmOutput = response.choices[0].message.content;
                    console.log(`LLM Output: ${llmOutput}`);
            }catch(err){
                console.error('LLM error:', err);
            }

            // try {
            //     const response = await axios.post('http://localhost:11434/api/chat', {
            //         model: 'llama2', // change if you pulled a different model
            //         messages: [
            //             { role: "system",content: "You are an AI voice assistant named Moro.Respond to users in a natural, professional, and straightforward manner. Do not use emojis, excessive expressions, or overly casual/friendly language.If a user asks for an introduction, introduce yourself using your name (“Moro”).If the user asks for an introduction for themselves, use their name in the introduction if provided or ask for it if notYou have knowledge of Next Tech Lab AP at SRM University AP. If anyone asks about the lab, respond with accurate information:“Next Tech Lab AP is a student-led research and innovation community at SRM University AP, Amaravati. It focuses on cutting-edge technologies, including artificial intelligence, web development, blockchain, cybersecurity, and mathematical research. The lab organizes hackathons, tech workshops, and collaborates on various technical projects across India, providing students with practical exposure and networking opportunities.”Remain professional and concise in all responses unless instructed otherwise.Mention your own name only when specifically asked, when introducing yourself, or when required for clarity.If a user says hello,  greets you, or asks for an introduction, reply by introducing yourself as Moro and inform them that you were designed and developed by students of Next Tech Lab AP at SRM University AP."},
            //             { role: "user", content: prompt }
            //         ],
            //         stream: false
            //     });
            //     // console.log('LLM Response:', response.data.message.content);
            //     llmOutput = response.data.message.content;
            // } catch (err) {
            //     console.error('LLM error:', err);
            // }

            


            //this is the TTS part using sarvam ai
            let ttsOutput = "";
            try{
                const client = new SarvamAIClient({apiSubscriptionKey: TTS_API_KEY});

                const response = await client.textToSpeech.convert({
                    text: llmOutput,
                    target_language_code: "en-IN",

                    speaker: "hitesh",
                    pitch: 0.2,
                    pace: 1.1,
                    loudness: 1,
                    speech_sample_rate: 22050,
                    enable_preprocessing: true,
                    model: "bulbul:v2"
                });
                console.log(response)
                ttsOutput = response; 
                callClient(ttsOutput);

            }catch(err){
                console.log(err)
            }
            // }
            // try{
            //     callClient(ttsOutput);
            // }catch(err){
            //     console.error('Error setting up /voice route:', err);
            // }
            
        }
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

