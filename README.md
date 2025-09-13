Features & Requirements

- Add guest with Name + RSVP (Yes / No / Maybe)
- Display a list of all guests; delete a guest
- Display totals and confirmed (Yes) counts
- Add Random Guest (https://randomuser.me/api/) - defaults to RSVP Maybe
- Friendly error handling (validation + network timeouts)
- Search by name and filter by RSVP
- Local persistence via AsyncStorage

Tech Stack

- Expo React Native (SDK 51), AsyncStorage

Run Locally

1. Install Node 18+ and Expo CLI (or use npx):
   - npm i -g expo-cli (optional)
2. run the following to install dependencies:
   - cd wedding-planner-expo
   - npm install
3. Start the app:
   - npm start (then choose a platform)
   - If you want to preview on web: npm run web
4. Follow prompts to run it on your device (Expo Go) or simulator.

Notes

- Use of random user API is rate limited; if it encounters a failure, you'll see a friendly error and can try again.
- All data is stored locally (AsyncStorage). If you clear the app data it will reset the list.
