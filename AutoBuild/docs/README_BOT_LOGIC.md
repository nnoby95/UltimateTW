# AutoBuildBot Core Logic (Updated)

This document explains, step by step, how the AutoBuildBot works in the Tribal Wars Auto Builder script, with per-village template assignment and scheduled data refresh.

---

## **Flowchart Overview**

```mermaid
graph TD
    A[Start Bot] --> B[Schedule Data Refresh]
    B --> C[Every 1 hour: For each village, collect and update data]
    C --> D[Main Bot Loop]
    D --> E{For each village}
    E --> F{Is template assigned?}
    F -- No --> Z[Skip]
    F -- Yes --> G[Get latest village data]
    G --> H{Is data available?}
    H -- No --> Z
    H -- Yes --> I[Get current game build queue]
    I --> J{Queue full?}
    J -- Yes --> Z
    J -- No --> K[Get next building from template]
    K --> L{Next building exists?}
    L -- No --> Z
    L -- Yes --> M{Can build? (resources, pop, not in queue)}
    M -- No --> Z
    M -- Yes --> N[Send build request]
    N --> O[Update database]
    O --> Z
```

---

## **Step-by-Step Logic**

1. **Scheduled Village Data Refresh**
    - Every 1 hour, for each village:
        - Collect fresh data: resources, free population, build queue, etc.
        - Save or refresh this data in the local DB.
    - The bot always uses the latest data for decisions.

2. **Per-Village Template Assignment**
    - Each village can have its own building template assigned.
    - The mapping is stored in settings: `villageTemplates: { [villageId]: templateName }`.
    - The UI allows you to assign/change the template for each village in a game-like table.

3. **Main Bot Loop**
    - For each village:
        - Check if a template is assigned. If not, skip.
        - Get the latest data for the village.
        - Get the current in-game build queue (max 5).
        - If the queue is full, skip.
        - Get the next building to build from the assigned template (in order).
        - If there is no building to build, skip.
        - Check if the building can be built (not already built, not in queue, enough resources and population).
        - If all checks pass, send the build request and update the local DB.

4. **UI for Template Assignment**
    - In the settings panel, there is a "Village Templates" section.
    - For each village, you see:
        - Village name (and ID)
        - A dropdown to select a template (populated with your saved templates)
        - The current template status (e.g., "Active: TemplateA")
    - The UI matches the game's style for seamless integration.

---

## **Key Points**
- The bot is now fully template-driven: only the assigned template for each village is used.
- No costup or other build logic is used.
- Data is always kept fresh with scheduled refreshes.
- The UI is clean, game-like, and user-friendly.

---

**For more details, see the code in `AutoBuild/src/bot/AutoBuildBot.js`, `AutoBuild/src/config/Settings.js`, and the settings panel UI.** 