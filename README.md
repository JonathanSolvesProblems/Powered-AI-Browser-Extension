# InstaQ

### Demo: [InstaQ - Google Chrome Built-in AI Challenge](https://www.youtube.com/watch?v=S1PiyPxxCXY)

# Instructions to Run

To get started, follow the following steps to import this project as a chrome extension locally:

1. **Prerequisites**

   - Install Google Canary, as this is the supported web client for the browser extension: [Google Canary](https://www.google.com/chrome/canary/)
   - Open Google Canary and ensure the following are enabled by copying the URLs into your Google Canary client below:
   - Enable the Summarization API for Gemini Nano:   ```chrome://flags/#summarization-api-for-gemini-nano```
   - Enable the Translator API: ```chrome://flags/#translation-api```
   - Enable the Prompt API in Extensions by selecting Enabled BypassPerfRequirement: ```chrome://flags/#optimization-guide-on-device-model```


2. **Clone the Repository**
   
   First, clone the repository to your local machine using the following command:

   ```bash
   git clone https://github.com/JonathanSolvesProblems/Powered-AI-Browser-Extension.git
   ```

   Alternatively, you can simply download this project and unzip it by clicking on the green "Code" button in the top right of the page and then the "Download ZIP" button.

3. **Go to the chrome extensions page on your web browser**

   Open your internet browser with Google Canary and go to the following URL:

   ```bash
   chrome://extensions/
   ```

4. **Load the extension into the browser**
 
   Click on the "Load unpacked" button on your browser and select the root folder that you downloaded on your local machine.

5. **Play with the browser extension**

   From there, the browser extension should now be loaded and will work as a regular extension. It is persistent, so it will always be where you left off. Enjoy!