// ==UserScript==
// @name         Script Extra Widgets Premium
// @version      4.9.7
// @description  Widgets available: Village Navigation Arrows; Adds a new column on the left of the main screen with: Village List, Notepad, Extra Build Queue(experimental); Maps extra options & Larger map view; Auto-Scavenging; Auto-Train Paladin and auto Paladins Training;
// @author       killwilll
// @require      https://github.com/nnoby95/UltimateTW/raw/main/Tribalwars_Script-master/utils.user.js
// @require      https://github.com/nnoby95/UltimateTW/raw/main/Tribalwars_Script-master/custom_css.user.js
// @require      https://github.com/nnoby95/UltimateTW/raw/main/Tribalwars_Script-master/settings_script.user.js
// @require      https://github.com/nnoby95/UltimateTW/raw/main/Tribalwars_Script-master/navigationArrows_script.user.js
// @require      https://github.com/nnoby95/UltimateTW/raw/main/Tribalwars_Script-master/map_script.user.js
// @require      https://github.com/nnoby95/UltimateTW/raw/main/Tribalwars_Script-master/overviewPremiumInfo.user.js
// @require      https://github.com/nnoby95/UltimateTW/raw/main/Tribalwars_Script-master/bot_trainerPaladin.user.js
// @require      https://github.com/nnoby95/UltimateTW/raw/main/Tribalwars_Script-master/bot_scavenging.user.js
// @require      https://github.com/nnoby95/UltimateTW/raw/main/Tribalwars_Script-master/widget_villageList.user.js
// @require      https://github.com/nnoby95/UltimateTW/raw/main/Tribalwars_Script-master/widget_notepad.user.js
// @require      https://github.com/nnoby95/UltimateTW/raw/main/Tribalwars_Script-master/widget_extraBuildQueue.user.js
// @require      https://github.com/nnoby95/UltimateTW/raw/main/Tribalwars_Script-master/widget_recruitTroops.user.js
// @updateURL    https://github.com/nnoby95/UltimateTW/raw/main/Tribalwars_Script-master/main.user.js
// @downloadURL  https://github.com/nnoby95/UltimateTW/raw/main/Tribalwars_Script-master/main.user.js
// @include      https://*.klanhaboru.hu/*
// @include      https://*.tribalwars.net/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// ==/UserScript==
(function () {
    'use strict';
    init();
    var villageList;
    function init() {
        restoreTimeouts();
        prepareLocalStorageItems();
        if (!document.getElementById('mobileContent')) {
            start();
        }
    }
})();
