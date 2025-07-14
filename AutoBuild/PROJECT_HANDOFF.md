# Auto Builder Userscript Project — Technical Handoff

## Project Purpose & Overview
This project is a userscript for the browser game Tribal Wars, designed to automate village building and resource management. It aims to:
- Automatically collect village data
- Queue and execute building upgrades based on user-defined templates
- Provide a user-friendly UI for configuration and monitoring
- Support multiple villages and robust automation

## Main Modules & Responsibilities
- **AutoBuildBot.js**: Main automation logic. Handles periodic checks, determines what to build, and issues build commands. Relies on settings, database, and data collection.
- **QueueManager.js**: Intended to manage the build queue and related operations. (Implementation status unclear; may be incomplete.)
- **ResourceMonitor.js**: (Not fully analyzed; likely tracks resources for automation.)
- **SettingsPanel.js**: UI for user configuration. Lets users set intervals, start/stop automation, and manage templates. Also manages the auto-refresh loop for village data.
- **BuildQueueUI.js**: UI for viewing/managing the build queue. (Currently a stub/TODO.)
- **VillageManager.js**: UI for managing villages. (Currently a stub/TODO.)
- **DatabaseManager.js**: Handles persistent storage of village data, resources, queues, and settings.
- **DataCollector.js**: Gathers all relevant data from the current game page (village info, resources, buildings, queue).
- **Settings.js**: Manages all user and bot settings, including templates and intervals.
- **BuildingConfig.js, BuildingCosts.js, DataHelper.js, GameUtils.js, TimeUtils.js**: Utility modules for building data, cost calculations, validation, and timing.

## Current Working Features
- Settings panel UI (wider, draggable, with interval and start/stop for auto-refresh)
- Auto-refresh loop that clicks the "Refresh Villages" button at a randomized interval
- Manual refresh of village data via the UI
- Data collection for the current village (when triggered)
- Settings persistence and import/export

## Known Issues & Missing Features
- **Building Queue Logic**: The bot does not currently add buildings to the in-game queue. The logic for determining and issuing build commands is present, but may not be fully wired up or tested.
- **Multi-Village Support**: The script does not yet automate navigation and data collection for all villages. Only the current village is refreshed.
- **UI Stubs**: BuildQueueUI and VillageManager are present but not implemented.
- **Error Handling**: Some console errors (e.g., DOM/port errors) are present. Error handling is basic in some modules.
- **Template Assignment**: Building templates must be assigned per village, but the UI/logic for this may be incomplete or buggy.
- **Game Integration**: The method for issuing build requests (`makeBuildRequest`) uses a placeholder for building IDs and may not work with the actual game backend.
- **Helper Functions**: Some helpers are globally exposed, but load order and userscript manager quirks can cause issues.

## How the Userscript Is Connected
- Injects all logic/UI into the Tribal Wars game page.
- Uses DOM manipulation to interact with the game and present UI.
- Relies on global objects (e.g., `window.AutoBuilder`, `window.SimpleDB`).
- Data collection and build actions are triggered by UI events or automation loops.
- All automation runs in the background as long as the userscript is active.

## Key Implementation Notes & Gotchas
- The auto-refresh loop now clicks the "Refresh Villages" button for reliability.
- Helper functions like `sleepRandom` have local fallbacks to avoid load order issues.
- The main bot logic is modular, but some modules are incomplete or only partially integrated.
- The build queue and multi-village support are not fully implemented.
- Some functions (e.g., `getBuildingId`) are placeholders and need real game logic.

## What Information Is Still Needed
- How to reliably identify and interact with the in-game build queue (DOM structure, request format).
- How to programmatically switch between villages in the game UI.
- The exact requirements for template assignment and management.
- Any anti-bot/anti-automation measures in the game that must be handled.
- User expectations for error handling, logging, and UI feedback.

## Suggestions for Next Steps
1. **Implement and test building queue logic**: Ensure the bot can actually add buildings to the in-game queue.
2. **Automate multi-village data collection**: Add logic to navigate between villages and collect data for each.
3. **Complete UI modules**: Finish BuildQueueUI and VillageManager for full user control.
4. **Improve error handling and logging**: Make failures visible and actionable for users.
5. **Replace placeholders with real game logic**: Especially for build requests and queue extraction.
6. **Document all helper functions and module APIs**.

---

**This file is intended as a technical handoff for another AI agent or developer. It summarizes the current state, known issues, and next steps. For any questions, review the codebase and this document together.** 