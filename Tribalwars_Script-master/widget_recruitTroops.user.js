function calculateMaxTroops(changedUnit = null) {
  // 1. Creates a snapshot of current values for all units.
  const currentQueued = {};
  game_data.units.forEach(unit => {
    const input = document.getElementById(unit + "_input");
    // Use Number() to ensure conversion; if empty, becomes 0.
    currentQueued[unit] = input ? Number(input.value) || 0 : 0;
  });

  // 2. Captures total available resources (converting to number)
  const totalResources = {
    wood: Number(document.getElementById("wood").textContent.replace('.', '')) || 0,
    stone: Number(document.getElementById("stone").textContent.replace('.', '')) || 0,
    iron: Number(document.getElementById("iron").textContent.replace('.', '')) || 0
  };

  // 3. Gets unit costs from localStorage
  const unitData = JSON.parse(localStorage.getItem('unit_managers_costs')) || {};

  // 4. For each unit, calculates the maximum additional possible
  game_data.units.forEach(unit => {
    const input = document.getElementById(unit + "_input");
    if (!input || !unitData[unit]) return;
    const costs = unitData[unit];
    const queued = currentQueued[unit]; // current value of the unit
    let additional = Infinity; // we start with a high value

    // For each resource used by the unit:
    Object.keys(costs).forEach(resource => {
      if (!(resource in totalResources)) return; // ignore if resource is not available

      const cost = costs[resource];

      // Sums the consumption of this resource done by all other units
      let consumptionOthers = 0;
      game_data.units.forEach(otherUnit => {
        if (otherUnit === unit) return; // ignore current unit
        if (!unitData[otherUnit]) return;
        const otherCosts = unitData[otherUnit];
        if (!(resource in otherCosts)) return;
        consumptionOthers += currentQueued[otherUnit] * otherCosts[resource];
      });

      // Resource available for unit _i_ (excluding its own consumption)
      const available = totalResources[resource] - consumptionOthers;

      // How many additional units can be trained for this resource?
      // If available is negative, the result will be negative – then we consider 0.
      const possible = available >= 0 ? Math.floor(available / cost) : 0;

      additional = Math.min(additional, possible);
    });

    // If the calculation results in non-finite or negative value, we use 0
    if (!isFinite(additional) || additional < 0) {
      additional = 0;
    }

    // 5. The new "max" for the unit is the sum of current value with allowed additional
    const isCurrentUnit = changedUnit || changedUnit === unit;
    let newMax = isCurrentUnit ? additional - queued : queued + additional;
    input.max = isCurrentUnit ? additional + newMax : newMax;

    // 6. Updates or creates the element that displays the additional value (next to the input)
    const maxElementId = unit + "_max";
    let maxElement = document.getElementById(maxElementId);
    if (!maxElement) {
      maxElement = document.createElement("a");
      maxElement.id = maxElementId;
      maxElement.style.marginLeft = "5px";
      input.parentNode.appendChild(maxElement);
    }
    maxElement.textContent = `(${newMax})`;
  });
}

async function submitTroops() {
  let bodyData = new URLSearchParams();

  game_data.units.forEach(unit => {
    const input = document.getElementById(unit + "_input");
    if (input && input.value > 0) {
      bodyData.append(`units[${unit}]`, input.value);
    }
  });

  if (!bodyData.toString()) return; // If there are no troops, don't make the request

  bodyData.append("h", game_data.csrf);

  await fetch(`${game_data.link_base_pure}barracks&ajaxaction=train&mode=train`, {
    headers: {
      "priority": "u=1, i",
      "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\", \"Microsoft Edge\";v=\"132\"",
      "sec-ch-ua-platform": "\"Windows\"",
      "tribalwars-ajax": "1",
      "x-requested-with": "XMLHttpRequest",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
    },
    referrer: `${game_data.link_base_pure}barracks`,
    body: bodyData.toString(),
    method: "POST",
    credentials: "include"
  });

  fetchTrainInfo();
  injectRecruitTroopsWidget();
}


function injectRecruitTroopsWidget() {
  if (settings_cookies.general['show__recruit_troops']) {
    const currentWidget = document.querySelector('#widget_recruit');
    if (currentWidget) currentWidget.remove();
    // Get troop data from localStorage
    const unitData = JSON.parse(localStorage.getItem('unit_managers_costs')) || {};
    const columnToUse = settings_cookies.widgets.find(widget => widget.name === 'recruit_troops').column;

    // Create the table
    const table = document.createElement('table');
    table.id = 'widget_recruit'
    table.className = 'vis';
    table.style.width = '100%';

    const tbody = document.createElement('tbody');

    // Create a row for each troop
    for (const unit in unitData) {
      const row = document.createElement('tr');
      row.style.display = '-webkit-box';

      // Column with troop icon and name
      const unitCell = document.createElement('td');
      unitCell.style.textAlign = 'center';
      unitCell.style.display = 'flex';
      unitCell.style.alignItems = 'center';
      unitCell.style.justifyContent = 'left';
      unitCell.style.gap = '5px'; // Space between icon and text
      unitCell.style.webkitBoxFlex = 1;

      const unitLink = document.createElement('a');
      unitLink.href = '#';
      unitLink.classList.add('unit_link');
      unitLink.dataset.unit = unit;

      const unitImg = document.createElement('img');
      unitImg.src = `https://dsen.innogamescdn.com/asset/243a567d/graphic/unit/unit_${unit}.png`;
      unitImg.alt = unit;
      unitImg.title = unit.charAt(0).toUpperCase() + unit.slice(1); // Capitaliza a primeira letra

      const unitName = document.createElement('span');
      unitName.textContent = unit.charAt(0).toUpperCase() + unit.slice(1); // Unit name

      unitLink.appendChild(unitImg);
      unitCell.appendChild(unitLink);
      unitCell.appendChild(unitName);
      row.appendChild(unitCell);

      // Column with input
      const inputCell = document.createElement('td');
      inputCell.style.textAlign = 'center';
      inputCell.style.webkitBoxFlex = 1;

      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.value = '0';
      input.className = `train-input train-${unit}`;
      input.id = `${unit}_input`;
      input.dataset.unit = unit;
      input.addEventListener('change', function () {
        calculateMaxTroops(unit);
      })

      inputCell.appendChild(input);
      row.appendChild(inputCell);

      tbody.appendChild(row);
    }

    table.appendChild(tbody);

    // Create a training button
    const trainButton = document.createElement('button');
    const lang = JSON.parse(localStorage.getItem('tw_lang'));
    trainButton.textContent = (lang && lang['e1de43dd18d19451febfc1584ab33767']) ?? 'Recruit';
    trainButton.className = 'btn btn-default';
    trainButton.addEventListener('click', submitTroops);

    // Create a container to wrap the table and button
    const container = document.createElement('div');
    container.appendChild(table);
    container.appendChild(trainButton);

    // Add to widget
    createWidgetElement({
      identifier: 'Recruit',
      contents: container,
      columnToUse,
      update: '',
      extra_name: 'troops',
      description: 'Train your troops'
    });
    calculateMaxTroops();

    //listeners to update on ressources update
    document.querySelectorAll("#wood, #iron, #stone").forEach(element => {
      calculateMaxTroops();
    });
  }
}