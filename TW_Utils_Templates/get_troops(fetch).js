
/*
 * Simple Troop Fetcher for Tribal Wars
 * Usage: getTroops(villageId) or getTroops() for current village
 */

async function getTroops(villageId = game_data.village.id) {
    try {
        const url = `/game.php?village=${villageId}&screen=overview_villages&mode=units`;
        const response = await fetch(url);
        const html = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Find the "total" row (has font-weight: bold)
        const totalRow = doc.querySelector('tr[style*="font-weight: bold"]');
        if (!totalRow) return null;
        
        // Extract troop counts from the total row
        const units = ['spear', 'sword', 'axe', 'spy', 'light', 'heavy', 'ram', 'catapult', 'snob', 'militia'];
        const cells = totalRow.querySelectorAll('.unit-item');
        const troops = {};
        
        units.forEach((unit, i) => {
            const cellText = cells[i]?.textContent?.trim() || '0';
            troops[unit] = parseInt(cellText);
        });
        
        return troops;
        
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// Usage examples:
// getTroops().then(troops => console.log('My troops:', troops));
// getTroops('16404').then(troops => console.log('Village troops:', troops));


////////////////////////////////////////////////////////////////
