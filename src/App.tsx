import { Player } from "./components/Player";

const videoUrl = "https://www.youtube.com/watch?v=8J54P94OOko";
const audioURl =
    "https://flask.dev-de.transcribe.torsunov.ru/download_rus?file_name=79f58732473311ef9f8102420a000008/audio.mp3";
function App() {
    return (
        <div>
            <h1>React YouTube & Audio Sync</h1>
            <Player
                youtubeUrl={videoUrl}
                audioUrl={audioURl}
                skipRanges={[[120, 180]]}
            />
        </div>
    );
}

export default App;
