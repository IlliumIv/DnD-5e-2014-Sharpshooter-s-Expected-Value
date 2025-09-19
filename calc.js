const Accuracy = {
    Normal: 0,
    Advantage: 1,
    Disadvantage: 2,
    ElvenAccuracy: 3
}

const Calculation = {
    ExpectedDamage: 0,
    NonCritHitChance: 1,
    CritHitChance: 2,
    HitChance: 3
}

const Mode = {
    NoFeat: 0,
    Feat: 1,
}

const DecimalDigitsUI = 3;
const DecimalDigitsChances = 12;

// https://anydice.com/program/3f539
const probabilityMatrix = [
        // Non Lucky: 0
    [
            // Normal: 0
        [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05],
            // Advantage: 1
        [0.0025, 0.0075, 0.0125, 0.0175, 0.0225, 0.0275, 0.0325, 0.0375, 0.0425, 0.0475, 0.0525, 0.0575, 0.0625, 0.0675, 0.0725, 0.0775, 0.0825, 0.0875, 0.0925, 0.0975],
            // Disadvantage: 2
        [0.0975, 0.0925, 0.0875, 0.0825, 0.0775, 0.0725, 0.0675, 0.0625, 0.0575, 0.0525, 0.0475, 0.0425, 0.0375, 0.0325, 0.0275, 0.0225, 0.0175, 0.0125, 0.0075, 0.0025],
            // ElvenAccuracy: 3
        [0.000125, 0.000875, 0.002375, 0.004625, 0.007625, 0.011375, 0.015875, 0.021125, 0.027125, 0.033875, 0.041375, 0.049625, 0.058625, 0.068375, 0.078875, 0.090125, 0.102125, 0.114875, 0.128375, 0.142625]
    ],
        // Lucky: 1
    [
            // Normal: 0
        [0.0025, 0.0525, 0.0525, 0.0525, 0.0525, 0.0525, 0.0525, 0.0525, 0.0525, 0.0525, 0.0525, 0.0525, 0.0525, 0.0525, 0.0525, 0.0525, 0.0525, 0.0525, 0.0525, 0.0525],
            // Advantage: 1
        [0.000125, 0.003125, 0.008625, 0.014125, 0.019625, 0.025125, 0.030625, 0.036125, 0.041625, 0.047125, 0.052625, 0.058125, 0.063625, 0.069125, 0.074625, 0.080125, 0.085625, 0.091125, 0.096625, 0.102125],
            // Disadvantage: 2
        [0.00725, 0.10175, 0.09625, 0.09075, 0.08525, 0.07975, 0.07425, 0.06875, 0.06325, 0.05775, 0.05225, 0.04675, 0.04125, 0.03575, 0.03025, 0.02475, 0.01925, 0.01375, 0.00825, 0.00275],
            // ElvenAccuracy: 3
        [0.0000003125, 0.0001671875, 0.0010771875, 0.0028553125, 0.0055015625, 0.0090159375, 0.0133984375, 0.0186490625, 0.0247678125, 0.0317546875, 0.0396096875, 0.0483328125, 0.0579240625, 0.0683834375, 0.0797109375, 0.0919065625, 0.1049703125, 0.1189021875, 0.1337021875, 0.1493703125]
    ]
]

function getChances(minToHitValue, minToCritValue, accuracyType, isLucky) {
    var probabilities = probabilityMatrix[+isLucky][accuracyType].slice(Math.min(20, Math.max(0, minToCritValue - 1)), undefined);
    var critChance = probabilities.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

    probabilities = probabilityMatrix[+isLucky][accuracyType].slice(Math.min(19, Math.max(0, minToCritValue - 1), Math.max(1, minToHitValue - 1)), undefined);
    var hitChance = probabilities.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

    var nonCritHitChance = Number((Math.max(0, hitChance - critChance)).toFixed(DecimalDigitsChances));
    hitChance = Number((hitChance).toFixed(DecimalDigitsChances));
    critChance = Number((critChance).toFixed(DecimalDigitsChances));

    return [nonCritHitChance, critChance, hitChance]
}

function calculate() {
    var flat = 0;
    var avgDices = 0;
    var avgDicesCrit = 0;

    var critSystem = document.querySelector("#crit-system-selector").value;
    var elements = document.getElementsByName("field");

    for (var i = 0; i < elements.length; i++) {
        var type = elements[i].querySelector("#type-selector").value;
        if (type == "dice") {
            var dice = elements[i].querySelector("#dice-selector").value;
            var diceCount = elements[i].querySelector("#dice-count").value;
            var canCrit = elements[i].querySelector("#can-crit-selector").value;

            if (canCrit != "only")
                avgDices = avgDices + getAvgDamage(false, dice, diceCount, critSystem);

            avgDicesCrit = avgDicesCrit + getAvgDamage(canCrit == "yes", dice, diceCount, critSystem);
        }
        if (type == "flat")
            flat = flat + elements[i].querySelector("#additive").value * 1;
    }
    
    var avgDamage = avgDices + flat;
    var avgCritDamage = avgDicesCrit + flat;

    var AB = document.querySelector("#attack-bonus").value * 1;
    var AC = document.querySelector("#armor-class").value * 1;
    var minToCritValue = document.querySelector("#min-crit-value").value * 1;
    var accuracyType = parseAttackType(document.querySelector("#attack-type-selector").value);

    var calcs = getCalculationsByRoll(AC - AB, minToCritValue, accuracyType, false, avgDamage, avgCritDamage);

    setValue("#avg-damage-no-feat", avgDamage);
    setValue("#avg-damage-feat", avgDamage + 10);
    setValue("#avg-crit-damage-no-feat", avgCritDamage);
    setValue("#avg-crit-damage-feat", avgCritDamage + 10);
    
    var comparer = "=";
    if (calcs[Mode.NoFeat][Calculation.HitChance] > calcs[Mode.Feat][Calculation.HitChance]) comparer = ">";
    if (calcs[Mode.NoFeat][Calculation.HitChance] < calcs[Mode.Feat][Calculation.HitChance]) comparer = "<";
    setValue("#hit-chance-comparer", comparer);
    // setValue("#hit-chance-no-feat", Math.round(calcs[Mode.NoFeat][Calculation.HitChance] * 100),
    setValue("#hit-chance-no-feat", Number((calcs[Mode.NoFeat][Calculation.HitChance] * 100).toFixed(DecimalDigitsUI)),
        calcs[Mode.NoFeat][Calculation.HitChance] > calcs[Mode.Feat][Calculation.HitChance]);
    // setValue("#hit-chance-feat", Math.round(calcs[Mode.Feat][Calculation.HitChance] * 100),
    setValue("#hit-chance-feat", Number((calcs[Mode.Feat][Calculation.HitChance] * 100).toFixed(DecimalDigitsUI)),
        calcs[Mode.Feat][Calculation.HitChance] > calcs[Mode.NoFeat][Calculation.HitChance]);
    
    comparer = "=";
    if (calcs[Mode.NoFeat][Calculation.NonCritHitChance] > calcs[Mode.Feat][Calculation.NonCritHitChance]) comparer = ">";
    if (calcs[Mode.NoFeat][Calculation.NonCritHitChance] < calcs[Mode.Feat][Calculation.NonCritHitChance]) comparer = "<";
    setValue("#non-crit-chance-comparer", comparer);
    setValue("#non-crit-chance-no-feat", Number((calcs[Mode.NoFeat][Calculation.NonCritHitChance] * 100).toFixed(DecimalDigitsUI)),
        calcs[Mode.NoFeat][Calculation.NonCritHitChance] > calcs[Mode.Feat][Calculation.NonCritHitChance]);
    setValue("#non-crit-chance-feat", Number((calcs[Mode.Feat][Calculation.NonCritHitChance] * 100).toFixed(DecimalDigitsUI)),
        calcs[Mode.Feat][Calculation.NonCritHitChance] > calcs[Mode.NoFeat][Calculation.NonCritHitChance]);
    
    comparer = "=";
    if (calcs[Mode.NoFeat][Calculation.CritHitChance] > calcs[Mode.Feat][Calculation.CritHitChance]) comparer = ">";
    if (calcs[Mode.NoFeat][Calculation.CritHitChance] < calcs[Mode.Feat][Calculation.CritHitChance]) comparer = "<";
    setValue("#crit-chance-comparer", comparer);
    setValue("#crit-chance-no-feat", Number((calcs[Mode.NoFeat][Calculation.CritHitChance] * 100).toFixed(DecimalDigitsUI)),
        calcs[Mode.NoFeat][Calculation.CritHitChance] > calcs[Mode.Feat][Calculation.CritHitChance]);
    setValue("#crit-chance-feat", Number((calcs[Mode.Feat][Calculation.CritHitChance] * 100).toFixed(DecimalDigitsUI)),
        calcs[Mode.Feat][Calculation.CritHitChance] > calcs[Mode.NoFeat][Calculation.CritHitChance]);

    comparer = "=";
    if (calcs[Mode.NoFeat][Calculation.ExpectedDamage] > calcs[Mode.Feat][Calculation.ExpectedDamage]) comparer = ">";
    if (calcs[Mode.NoFeat][Calculation.ExpectedDamage] < calcs[Mode.Feat][Calculation.ExpectedDamage]) comparer = "<";
    setValue("#expectation-damage-comparer", comparer);
    setValue("#expectation-damage-no-feat", calcs[Mode.NoFeat][Calculation.ExpectedDamage],
        calcs[Mode.NoFeat][Calculation.ExpectedDamage] > calcs[Mode.Feat][Calculation.ExpectedDamage]);
    setValue("#expectation-damage-feat", calcs[Mode.Feat][Calculation.ExpectedDamage],
        calcs[Mode.Feat][Calculation.ExpectedDamage] > calcs[Mode.NoFeat][Calculation.ExpectedDamage]);

    var disabled = document.querySelector("#feat-disabled");
    disabled.classList.remove("winner");
    var enabled = document.querySelector("#feat-enabled");
    enabled.classList.remove("winner");
    comparer = ">";

    if (calcs[Mode.NoFeat][Calculation.ExpectedDamage] >= calcs[Mode.Feat][Calculation.ExpectedDamage]) {
        disabled.classList.add("winner");
    }
    else {
        enabled.classList.add("winner");
        comparer = "<";
    }
    setValue("#feat-usage-comparer", comparer);

    var disableBreakpoint = getDisableBreakpoint(minToCritValue, accuracyType, false, avgDamage, avgCritDamage);
    var enableBreakpoint = getEnableBreakpoint(disableBreakpoint, minToCritValue, accuracyType, false, avgDamage, avgCritDamage) - 1;
    disableBreakpoint = disableBreakpoint + AB;
    enableBreakpoint = enableBreakpoint + AB;
    setValue("#breakpoint-disable-feat", disableBreakpoint > 0 ? disableBreakpoint : 0);
    setValue("#breakpoint-enable-feat", enableBreakpoint > 0 ? enableBreakpoint : 0);
    
    save();
}

function parseAttackType(str) {
    switch (str) {
        case "normal": return Accuracy.Normal;
        case "advantage": return Accuracy.Advantage;
        case "disadvantage": return Accuracy.Disadvantage;
        case "elven": return Accuracy.ElvenAccuracy;
    }
}

function getCalculationsByRoll(value, minToCritValue, accuracyType, isLucky, avgDamage, avgCritDamage) {
    var chances = getChances(value, minToCritValue, accuracyType, isLucky);
    var calcs = [];
    // No Feat Damage and Chances
    calcs[0] = [Number((chances[0] * avgDamage + chances[1] * avgCritDamage).toFixed(DecimalDigitsUI)), chances[0], chances[1], chances[2]]
    var chances = getChances(value + 5, minToCritValue, accuracyType, isLucky);
    // Feat Damage and Chances
    calcs[1] = [Number((chances[0] * (avgDamage + 10) + chances[1] * (avgCritDamage + 10)).toFixed(DecimalDigitsUI)), chances[0], chances[1], chances[2]]
    return calcs;
}

function getDisableBreakpoint(minToCritValue, accuracyType, isLucky, avgDamage, avgCritDamage) {
    var AC = 0;
    var counter = 0;
    var calcs = getCalculationsByRoll(AC, minToCritValue, accuracyType, isLucky, avgDamage, avgCritDamage);
    while (calcs[Mode.Feat][Calculation.ExpectedDamage] >= calcs[Mode.NoFeat][Calculation.ExpectedDamage] && counter < 51) {
        AC++;
        var cache = {noFeatExpDamage: calcs[Mode.NoFeat][Calculation.ExpectedDamage],
                     featExpDamage: calcs[Mode.Feat][Calculation.ExpectedDamage]};

        calcs = getCalculationsByRoll(AC, minToCritValue, accuracyType, isLucky, avgDamage, avgCritDamage);
        if (cache.noFeatExpDamage <= calcs[Mode.NoFeat][Calculation.ExpectedDamage] && cache.featExpDamage >= calcs[Mode.Feat][Calculation.ExpectedDamage])
            counter++;
        cache = {noFeatExpDamage: calcs[Mode.NoFeat][Calculation.ExpectedDamage], featExpDamage: calcs[Mode.Feat][Calculation.ExpectedDamage]};
    }
    return AC >= 50 ? NaN : AC;
}

function getEnableBreakpoint(disableBreakpoint, minToCritValue, accuracyType, isLucky, avgDamage, avgCritDamage) {
    var AC = disableBreakpoint;
    var calcs = getCalculationsByRoll(AC, minToCritValue, accuracyType, isLucky, avgDamage, avgCritDamage);

    while (calcs[Mode.Feat][Calculation.ExpectedDamage] <= calcs[Mode.NoFeat][Calculation.ExpectedDamage]) {
        AC++;
        calcs = getCalculationsByRoll(AC, minToCritValue, accuracyType, isLucky, avgDamage, avgCritDamage);
    }

    return AC;
}

//----------------------------------------


function addSource() {
    var sources = JSON.parse('[{"i":0,"name":"Base damage","type":"dice","count":"1","dice":"6","canCrit":"yes"}]');

    sources[0].name = window.prompt("Please enter source name:", sources[0].name);
    if (sources[0].name == null) return;

    restoreSources(sources, false);
}

function exportCalculation() {
    var Sources = getSourcesJson();
    var Settings = getSettingsJson();
    var calc = {Sources, Settings};

    var options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
    };

    downloadStringAsFile(JSON.stringify(calc), "Sharpshooter's Expected Value " + new Date().toLocaleDateString(undefined, options) + ".txt", "text/plain");
}

function downloadStringAsFile(content, fileName, contentType) {
    var blob = new Blob([content], { type: contentType });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}

function importCalculation() {
    // https://stackoverflow.com/a/40971885
    var input = document.createElement("input");
    input.type = "file";

    input.onchange = e => { 
        var file = e.target.files[0]; 
        var reader = new FileReader();
        reader.readAsText(file,"UTF-8");
        reader.onload = readerEvent => {
            var content = readerEvent.target.result;
            var calc = JSON.parse(content);
            localStorage.setItem("Sources", calc.Sources);
            localStorage.setItem("Settings", calc.Settings);
            restoreSettings();
            restoreSources(null, true);
        }
    }

    input.click();
}

function getSourcesJson() {
    var arr = [];
    var fields = document.getElementsByName("field");

    for (var i = 0; i < fields.length; i++) {
        var name = fields[i].querySelector("#field-name").innerHTML;
        var type = fields[i].querySelector("#type-selector").value;
        var count = type == "dice" ? fields[i].querySelector("#dice-count").value : 1;
        var dice = type == "dice" ? fields[i].querySelector("#dice-selector").value : fields[i].querySelector("#additive").value;
        var canCrit = fields[i].querySelector("#can-crit-selector").value;
        var source = {i, name, type, count, dice, canCrit};
        arr.push(source);
    }

    return JSON.stringify(arr);
}

function getSettingsJson() {
    var arr = [];
    var settings = document.getElementsByName("parameter");

    for (var i = 0; i < settings.length; i++) {
        var id = settings[i].id;
        var value = settings[i].value;
        var setting = {i, id, value};
        arr.push(setting);
    }

    return JSON.stringify(arr);
}

function save() {
    localStorage.setItem("Sources", getSourcesJson());
    localStorage.setItem("Settings", getSettingsJson());
}

function restoreSettings() {
    var settings = JSON.parse(localStorage.getItem("Settings"));
    if (settings == null) return;

    var settingsContainer = document.querySelector("#settings-container");

    settings.forEach(param => {
        settingsContainer.querySelector("#" + param.id).value = param.value;
    });
}

function restoreSources(sources, needOverwrite) {
    var sources = sources
        ?? JSON.parse(localStorage.getItem("Sources"))
        ?? JSON.parse('[{"i":0,"name":"Base damage","type":"dice","count":"1","dice":"6","canCrit":"yes"}]');

    var fieldContainer = document.querySelector("#fields-container");

    if (needOverwrite)
        fieldContainer.innerHTML = "";
    
    var fieldTemplate = document.querySelector("#field-template");

    for (var i = 0; i < sources.length; i++) {
        var field = document.importNode(fieldTemplate.content, true);
        fieldContainer.appendChild(field);
        fieldContainer.lastElementChild.querySelector("#field-name").innerHTML = sources[i].name;
        fieldContainer.lastElementChild.querySelector("#type-selector").value = sources[i].type;
        renderSourceDamage(sources[i].type, fieldContainer.lastElementChild);
        renderAttackTypeIcon();
        fieldContainer.lastElementChild.querySelector("#can-crit-selector").value = sources[i].canCrit;
        
        if (sources[i].type == "dice") {
            fieldContainer.lastElementChild.querySelector("#dice-count").value = sources[i].count;
            fieldContainer.lastElementChild.querySelector("#dice-selector").value = sources[i].dice;
        }
        
        if (sources[i].type == "flat") {
            fieldContainer.lastElementChild.querySelector("#additive").value = sources[i].dice;
        }
    }

    if (fieldContainer.childElementCount == 1)
        fieldContainer.lastElementChild.querySelector("#delete-source-button").setAttribute("disabled", "");

    if (fieldContainer.childElementCount > 1)
        fieldContainer.firstElementChild.querySelector("#delete-source-button").removeAttribute("disabled");

    calculate();
}

function deleteSource(e) {
    var caller = e.target || e.srcElement;
    var field = caller.parentElement.parentElement;
    var fieldContainer = document.querySelector("#fields-container");

    if (fieldContainer.childElementCount > 1)
        fieldContainer.removeChild(field);

    if (fieldContainer.childElementCount == 1)
        fieldContainer.lastElementChild.querySelector("#delete-source-button").setAttribute("disabled", "");

    calculate();
}

function renameSource(e) {
    var caller = e.target || e.srcElement;
    var field = caller.parentElement.parentElement;

    var sourceName = window.prompt("Please enter source name:", field.querySelector("#field-name").innerHTML);
    if (sourceName == null) return;

    field.querySelector("#field-name").innerHTML = sourceName;

    save();
}

function onChangeDamageType(e) {
    var caller = e.target || e.srcElement;
    var field = caller.parentElement.parentElement;
    var templateType = caller.value;

    field.removeChild(field.querySelector("#damage-container"));
    field.removeChild(field.querySelector("#can-crit-selector"));

    renderSourceDamage(templateType, field);

    calculate();
}

function renderAttackTypeIcon() {
    var attackType = document.querySelector("#attack-type-selector").value;
    var icon = document.querySelector("#attack-type-icon");

    if (attackType == "normal") {
        icon.classList.remove("fa-check-double");
    }
    if (attackType == "advantage" || attackType == "elven") {
        icon.classList.remove("disadvantage");
        icon.classList.add("fa-check-double");
        icon.classList.add("advantage");
    }
    if (attackType == "disadvantage") {
        icon.classList.remove("advantage");
        icon.classList.add("fa-check-double");
        icon.classList.add("disadvantage");
    }
}

function onChangeAttackType() {
    renderAttackTypeIcon();

    calculate();
}

function renderSourceDamage(templateType, field) {
    var template;
    if (templateType == "dice")
        template = document.querySelector("#dice-damage-template");
    if (templateType == "flat")
        template = document.querySelector("#flat-damage-template");
    
    field.appendChild(document.importNode(template.content, true));

    var canCritTemplate = document.querySelector("#can-crit-template")
    field.appendChild(document.importNode(canCritTemplate.content, true));

    var iconContainer = field.querySelector("#damage-type-icon");
    iconContainer.innerHTML = "";

    if (templateType == "dice") {
        var iconTemplate = document.querySelector("#icon-d20");
        iconContainer.appendChild(document.importNode(iconTemplate.content, true));
        field.querySelector("#yes").setAttribute("selected", "");
    }
    if (templateType == "flat") {
        field.querySelector("#no").setAttribute("selected", "")
        field.querySelector("#can-crit-selector").setAttribute("disabled", "")
    }
}

function getNonCritHitChance(withFeat, AC, AB, critCount) {
    var gap = withFeat ? 16 : 21;
    return Math.min(Math.max(gap - critCount + AB - AC, 0), Math.max(19 - critCount,0));
}

function expDamage(withFeat, nonCritHitChance, avgDamage, avgCritDamage, critCount) {
    var add = withFeat ? 10 : 0;
    return ((avgDamage + add) * nonCritHitChance + (avgCritDamage + add) * critCount) / 20;
}

function getAvgDamage(isCrit, dice, diceCount, critSystem) {
    return isCrit
        ? diceCount * (dice * (critSystem == "max-plus-dice" ? 3 : 2) + (critSystem == "max-plus-dice" ? 1 : 2)) / 2
        : diceCount * (dice * 1 + 1) / 2;
}

function calculateOld() {
    var flat = 0;
    var avgDices = 0;
    var avgCrit = 0;

    var critSystem = document.querySelector("#crit-system-selector").value;
    var elements = document.getElementsByName("field");

    for (var i = 0; i < elements.length; i++) {
        var type = elements[i].querySelector("#type-selector").value;
        if (type == "dice") {
            var dice = elements[i].querySelector("#dice-selector").value;
            var diceCount = elements[i].querySelector("#dice-count").value;
            var canCrit = elements[i].querySelector("#can-crit-selector").value;

            if (canCrit != "only")
                avgDices = avgDices + getAvgDamage(false, dice, diceCount, critSystem);

            avgCrit = avgCrit + getAvgDamage(canCrit == "yes", dice, diceCount, critSystem);
        }
        if (type == "flat")
            flat = flat + elements[i].querySelector("#additive").value * 1;
    }

    var avgDamage = avgDices + flat;
    var avgCritDamage = avgCrit + flat;
    var AC = document.querySelector("#armor-class").value * 1;
    var AB = document.querySelector("#attack-bonus").value * 1;
    var critCount = 21 - document.querySelector("#min-crit-value").value * 1;
    var nonCritHitChanceNoFeat = getNonCritHitChance(false, AC, AB, critCount);
    var nonCritHitChanceFeat = getNonCritHitChance(true, AC, AB, critCount);

    setValue("#avg-damage-no-feat", avgDamage);
    setValue("#avg-damage-feat", avgDamage + 10);
    setValue("#avg-crit-damage-no-feat", avgCritDamage);
    setValue("#avg-crit-damage-feat", avgCritDamage + 10);

    var noFeatHitChance = Math.round(Math.max(nonCritHitChanceNoFeat + 1, 1) / 20 * 100);
    var featHitChance = Math.round(Math.max(nonCritHitChanceFeat + 1, 1) / 20 * 100);
    var comparer = "=";
    if (noFeatHitChance > featHitChance) comparer = ">";
    if (noFeatHitChance < featHitChance) comparer = "<";
    setValue("#hit-chance-comparer", comparer);
    setValue("#hit-chance-no-feat", noFeatHitChance, noFeatHitChance > featHitChance);
    setValue("#hit-chance-feat", featHitChance, featHitChance > noFeatHitChance);

    var noFeatExpDamage = expDamage(false, nonCritHitChanceNoFeat, avgDamage, avgCritDamage, critCount);
    var featExpDamage = expDamage(true, nonCritHitChanceFeat, avgDamage, avgCritDamage, critCount);
    comparer = "=";
    if (noFeatExpDamage > featExpDamage) comparer = ">";
    if (noFeatExpDamage < featExpDamage) comparer = "<";
    setValue("#expectation-damage-comparer", comparer);
    setValue("#expectation-damage-no-feat", noFeatExpDamage, noFeatExpDamage > featExpDamage);
    setValue("#expectation-damage-feat", featExpDamage, featExpDamage > noFeatExpDamage);

    var disabled = document.querySelector("#feat-disabled");
    disabled.classList.remove("winner");
    var enabled = document.querySelector("#feat-enabled");
    enabled.classList.remove("winner");
    comparer = ">";

    if (noFeatExpDamage >= featExpDamage)
        disabled.classList.add("winner");
    else {
        enabled.classList.add("winner");
        comparer = "<";
    }
    setValue("#feat-usage-comparer", comparer);

    var disableBreakpoint = getDisableBreakpointOld(AB, avgDamage, avgCritDamage);
    setValue("#breakpoint-disable-feat", disableBreakpoint > 0 ? disableBreakpoint: 0);
    var enableBreakpoint = getEnableBreakpointOld(disableBreakpoint, AB, avgDamage, avgCritDamage) - 1;
    setValue("#breakpoint-enable-feat", enableBreakpoint > 0 ? enableBreakpoint : 0);
    
    save();
}

function getDisableBreakpointOld(AB, avgDamage, avgCritDamage) {
    var AC = AB - 5 + 1;
    
    var nonCritHitChanceNoFeat = getNonCritHitChance(false, AC, AB, critCount);
    var nonCritHitChanceFeat = getNonCritHitChance(true, AC, AB, critCount);
    
    var noFeatExpDamage = expDamage(false, nonCritHitChanceNoFeat, avgDamage, avgCritDamage, critCount);
    var featExpDamage = expDamage(true, nonCritHitChanceFeat, avgDamage, avgCritDamage, critCount);

    var counter = 0;

    while (featExpDamage > noFeatExpDamage && counter < 99) {
        AC++;

        var cache = {noFeatExpDamage, featExpDamage};

        nonCritHitChanceNoFeat = getNonCritHitChance(false, AC, AB, critCount);
        nonCritHitChanceFeat = getNonCritHitChance(true, AC, AB, critCount);
        
        noFeatExpDamage = expDamage(false, nonCritHitChanceNoFeat, avgDamage, avgCritDamage, critCount);
        featExpDamage = expDamage(true, nonCritHitChanceFeat, avgDamage, avgCritDamage, critCount);
        
        if (cache.noFeatExpDamage <= noFeatExpDamage && cache.featExpDamage >= featExpDamage)
            counter ++;

        cache = {noFeatExpDamage, featExpDamage};
    }

    return AC >= 100 ? NaN : AC;
}

function getEnableBreakpointOld(AC, AB, avgDamage, avgCritDamage) {
    AC++;
    var nonCritHitChanceNoFeat = getNonCritHitChance(false, AC, AB, critCount);
    var nonCritHitChanceFeat = getNonCritHitChance(true, AC, AB, critCount);
    
    var noFeatExpDamage = expDamage(false, nonCritHitChanceNoFeat, avgDamage, avgCritDamage, critCount);
    var featExpDamage = expDamage(true, nonCritHitChanceFeat, avgDamage, avgCritDamage, critCount);

    while (featExpDamage < noFeatExpDamage) {
        AC++;
        nonCritHitChanceNoFeat = getNonCritHitChance(false, AC, AB, critCount);
        nonCritHitChanceFeat = getNonCritHitChance(true, AC, AB, critCount);
        
        noFeatExpDamage = expDamage(false, nonCritHitChanceNoFeat, avgDamage, avgCritDamage, critCount);
        featExpDamage = expDamage(true, nonCritHitChanceFeat, avgDamage, avgCritDamage, critCount);
    }

    return AC;
}

function setValue(elementId, value, winner) {
    var element = document.querySelector(elementId);
    element.innerHTML = "";
    element.innerHTML = value;

    if (winner == undefined) return;
    element.classList.remove("winner");
    if (winner == true) element.classList.add("winner");
}

restoreSettings();
restoreSources(null, true);