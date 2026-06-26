const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const sourceLanguage = document.getElementById("sourceLanguage");
const targetLanguage = document.getElementById("targetLanguage");
const translateButton = document.getElementById("translateButton");
const copyButton = document.getElementById("copyButton");
const speakButton = document.getElementById("speakButton");
const swapButton = document.getElementById("swapButton");
const message = document.getElementById("message");

const translationApiUrl = "https://api.mymemory.translated.net/get";

function showMessage(text, type = "") {
  message.textContent = text;
  message.className = type ? `message ${type}` : "message";
}

function setLoading(isLoading) {
  translateButton.disabled = isLoading;
  translateButton.textContent = isLoading ? "Translating..." : "Translate";
}

async function callTranslationApi(text, source, target) {
  const params = new URLSearchParams({
    q: text,
    langpair: `${source}|${target}`
  });

  const response = await fetch(`${translationApiUrl}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Translation service returned ${response.status}`);
  }

  const data = await response.json();

  if (data.responseStatus !== 200) {
    throw new Error(data.responseDetails || "The translation service could not translate this text.");
  }

  if (!data.responseData || !data.responseData.translatedText) {
    throw new Error("Translation response did not include translated text.");
  }

  return data.responseData.translatedText;
}

async function translateText() {
  const text = inputText.value.trim();
  const source = sourceLanguage.value;
  const target = targetLanguage.value;

  if (!text) {
    outputText.value = "";
    showMessage("Please enter text before translating.", "error");
    inputText.focus();
    return;
  }

  if (source === target) {
    showMessage("Choose two different languages.", "error");
    return;
  }

  setLoading(true);
  showMessage("Sending text to the translation API...");

  try {
    const translatedText = await callTranslationApi(text, source, target);
    outputText.value = translatedText;
    showMessage("Translation complete.", "success");
  } catch (error) {
    outputText.value = "";
    showMessage(`Translation failed. ${error.message}`, "error");
  } finally {
    setLoading(false);
  }
}

async function copyTranslation() {
  const translatedText = outputText.value.trim();

  if (!translatedText) {
    showMessage("There is no translated text to copy yet.", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(translatedText);
    showMessage("Translated text copied to clipboard.", "success");
  } catch (error) {
    showMessage("Copy failed. Select the output text and copy it manually.", "error");
  }
}

function speakTranslation() {
  const translatedText = outputText.value.trim();

  if (!translatedText) {
    showMessage("There is no translated text to speak yet.", "error");
    return;
  }

  if (!("speechSynthesis" in window)) {
    showMessage("Text-to-speech is not supported in this browser.", "error");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(translatedText);
  utterance.lang = targetLanguage.value;
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);

  showMessage("Speaking translated text.", "success");
}

function swapLanguages() {
  const oldSource = sourceLanguage.value;
  sourceLanguage.value = targetLanguage.value;
  targetLanguage.value = oldSource;

  const oldInput = inputText.value;
  inputText.value = outputText.value;
  outputText.value = oldInput;

  showMessage("Languages swapped.", "success");
}

translateButton.addEventListener("click", translateText);
copyButton.addEventListener("click", copyTranslation);
speakButton.addEventListener("click", speakTranslation);
swapButton.addEventListener("click", swapLanguages);

inputText.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key === "Enter") {
    translateText();
  }
});
