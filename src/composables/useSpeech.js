// Speech synthesis utility
let voiceLang = 'en-US'
let selectedVoiceURI = ''
let speechRate = 1.0
let speechPitch = 1.0
let availableVoices = []

export function getSpeechConfig() {
  return { voiceLang, selectedVoiceURI, speechRate, speechPitch }
}

export function setSpeechConfig(config) {
  if (config.voiceLang !== undefined) voiceLang = config.voiceLang
  if (config.selectedVoiceURI !== undefined) selectedVoiceURI = config.selectedVoiceURI
  if (config.speechRate !== undefined) speechRate = config.speechRate
  if (config.speechPitch !== undefined) speechPitch = config.speechPitch
}

export function speakText(text, callback) {
  if (!text || !window.speechSynthesis) {
    if (callback) callback()
    return
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = voiceLang
  utterance.rate = speechRate
  utterance.pitch = speechPitch
  if (selectedVoiceURI) {
    const voices = window.speechSynthesis.getVoices()
    const matched = voices.find(v => v.voiceURI === selectedVoiceURI)
    if (matched) utterance.voice = matched
  }
  if (callback) {
    utterance.onend = callback
    utterance.onerror = callback
  }
  window.speechSynthesis.speak(utterance)
}

export function populateVoiceSelector(selectEl) {
  if (!window.speechSynthesis) return
  availableVoices = window.speechSynthesis.getVoices()
  if (!selectEl) return
  const currentVal = selectEl.value
  selectEl.innerHTML = '<option value="">系统默认</option>'
  const langVoices = availableVoices.filter(v => v.lang.startsWith('en'))
  const seen = new Set()
  langVoices.forEach(voice => {
    const key = voice.voiceURI + voice.name
    if (seen.has(key)) return
    seen.add(key)
    const opt = document.createElement('option')
    opt.value = voice.voiceURI
    opt.textContent = `${voice.name} (${voice.lang})`
    selectEl.appendChild(opt)
  })
  if (currentVal) selectEl.value = currentVal
}

export function getAvailableVoices() {
  return availableVoices
}
