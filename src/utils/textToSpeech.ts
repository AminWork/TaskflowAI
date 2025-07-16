export function speakText(text: string): void {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    // Try to use a more natural voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Natural') ||
      voice.name.includes('Enhanced')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    speechSynthesis.speak(utterance);
  }
}