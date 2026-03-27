---
description: How to package the Android app for phone installation
---
# Packaging for Android Installation

To build a fresh version of the app to install on your phone:

1.  Make sure your current changes are saved and any active dev servers are running.
2.  Open a terminal in the `streakly` directory.
3.  Run the following command to generate the **Release APK** (best for standalone use):
    ```powershell
    cd android; .\gradlew assembleRelease
    ```
    *Note: If you just want to test with a developer connection (Metro), use `assembleDebug` instead.*

4.  Once the build finishes, your APK will be located at:
    `streakly/android/app/build/outputs/apk/release/app-release.apk`
    (or `app-debug.apk` if you built the debug version).

# Installing on your Phone

1.  **Transfer the APK**: Move the `app-debug.apk` file to your phone using USB, Google Drive, or any file-sharing method (e.g. Quick Share).
2.  **Enable Unknown Sources**: If you haven't already, go to your phone's Settings > Security (or App Info for your File Manager/Drive app) and allow "Install unknown apps".
3.  **Install**: Open the APK file on your phone and follow the prompts to install.
4.  **Launch**: Once installed, you will find the `streakly` icon in your app drawer!

> [!NOTE]
> Since this is a debug build, you might need to have your laptop and phone on the same Wi-Fi network if you want to use the Metro bundler features during development, but the APK will run independently once installed.
