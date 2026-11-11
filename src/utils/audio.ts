/**
 * Text-to-Speech audio utility for French and English pronunciation
 */
export function speakWord(text: string, lang: 'fr' | 'en') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop ongoing speech

    // Clean word from "to " if needed or speak full expression
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
    utterance.rate = 0.9; // Slightly slower for language learners
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const targetLangPrefix = lang === 'fr' ? 'fr' : 'en';
    const preferredVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetLangPrefix));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    // Fail silently without breaking the app
  }
}
