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
    var fields = document.getElementsByClassName("field");

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
    var settings = document.querySelector("#settings-container").getElementsByClassName("parameter");

    for (var i = 0; i < settings.length; i++) {
        var element = settings[i].querySelector("input") ?? settings[i].querySelector("select");
        var id = element.id;
        var value = element.value;
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

function changeType(e) {
    var caller = e.target || e.srcElement;
    var field = caller.parentElement.parentElement;
    var templateType = caller.value;

    field.removeChild(field.querySelector("#damage-container"));
    field.removeChild(field.querySelector("#can-crit-selector"));

    renderSourceDamage(templateType, field);

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

    var icon = field.querySelector("#icon");
    if (templateType == "dice") {
        field.querySelector("#yes").setAttribute("selected", "")
        icon.classList.remove("fa-plus");
        icon.classList.add("fa-dice-d20");
    }
    if (templateType == "flat") {
        icon.classList.remove("fa-dice-d20");
        icon.classList.add("fa-plus");
        field.querySelector("#no").setAttribute("selected", "")
        field.querySelector("#can-crit-selector").setAttribute("disabled", "")
    }
}

function getNonCritHitChance(withFeat, AC, AB) {
    var gap = withFeat ? 15 : 20;
    return Math.min(Math.max(gap + AB - AC, 0), 18);
}

function expDamage(withFeat, nonCritHitChance, avgDamage, avgCritDamage) {
    var add = withFeat ? 10 : 0;
    return ((avgDamage + add) * nonCritHitChance + avgCritDamage + add) / 20;
}

function getAvgDamage(isCrit, dice, diceCount, critSystem) {
    return isCrit
        ? diceCount * (dice * (critSystem == "max-plus-dice" ? 3 : 2) + (critSystem == "max-plus-dice" ? 1 : 2)) / 2
        : diceCount * (dice * 1 + 1) / 2;
}

function calculate() {
    var flat = 0;
    var avgDices = 0;
    var avgCrit = 0;

    var critSystem = document.querySelector("#crit-system-selector").value;
    var elements = document.getElementsByClassName("field");

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
    var nonCritHitChanceNoFeat = getNonCritHitChance(false, AC, AB);
    var nonCritHitChanceFeat = getNonCritHitChance(true, AC, AB);

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

    var noFeatExpDamage = expDamage(false, nonCritHitChanceNoFeat, avgDamage, avgCritDamage);
    var featExpDamage = expDamage(true, nonCritHitChanceFeat, avgDamage, avgCritDamage);
    comparer = "=";
    if (noFeatExpDamage > featExpDamage) comparer = ">";
    if (noFeatExpDamage < featExpDamage) comparer = "<";
    setValue("#expectation-damage-comparer", comparer);
    setValue("#expectation-damage-no-feat", noFeatExpDamage, noFeatExpDamage > featExpDamage);
    setValue("#expectation-damage-feat", featExpDamage, featExpDamage > noFeatExpDamage);

    var disableBreakpoint = getDisableBreakpoint(AB, avgDamage, avgCritDamage);
    setValue("#breakpoint-disable-feat", disableBreakpoint);
    setValue("#breakpoint-enable-feat", getEnableBreakpoint(disableBreakpoint, AB, avgDamage, avgCritDamage) - 1);
    
    save();
}

function getDisableBreakpoint(AB, avgDamage, avgCritDamage) {
    var AC = AB - 5 + 1;
    
    var nonCritHitChanceNoFeat = getNonCritHitChance(false, AC, AB);
    var nonCritHitChanceFeat = getNonCritHitChance(true, AC, AB);
    
    var noFeatExpDamage = expDamage(false, nonCritHitChanceNoFeat, avgDamage, avgCritDamage);
    var featExpDamage = expDamage(true, nonCritHitChanceFeat, avgDamage, avgCritDamage);

    var counter = 0;

    while (featExpDamage > noFeatExpDamage && counter < 99) {
        AC++;

        var cache = {noFeatExpDamage, featExpDamage};

        nonCritHitChanceNoFeat = getNonCritHitChance(false, AC, AB);
        nonCritHitChanceFeat = getNonCritHitChance(true, AC, AB);
        
        noFeatExpDamage = expDamage(false, nonCritHitChanceNoFeat, avgDamage, avgCritDamage);
        featExpDamage = expDamage(true, nonCritHitChanceFeat, avgDamage, avgCritDamage);
        
        if (cache.noFeatExpDamage <= noFeatExpDamage && cache.featExpDamage >= featExpDamage)
            counter ++;

        cache = {noFeatExpDamage, featExpDamage};
    }

    return AC >= 100 ? NaN : AC;
}

function getEnableBreakpoint(AC, AB, avgDamage, avgCritDamage) {
    AC++;
    var nonCritHitChanceNoFeat = getNonCritHitChance(false, AC, AB);
    var nonCritHitChanceFeat = getNonCritHitChance(true, AC, AB);
    
    var noFeatExpDamage = expDamage(false, nonCritHitChanceNoFeat, avgDamage, avgCritDamage);
    var featExpDamage = expDamage(true, nonCritHitChanceFeat, avgDamage, avgCritDamage);

    while (featExpDamage < noFeatExpDamage) {
        AC++;
        nonCritHitChanceNoFeat = getNonCritHitChance(false, AC, AB);
        nonCritHitChanceFeat = getNonCritHitChance(true, AC, AB);
        
        noFeatExpDamage = expDamage(false, nonCritHitChanceNoFeat, avgDamage, avgCritDamage);
        featExpDamage = expDamage(true, nonCritHitChanceFeat, avgDamage, avgCritDamage);
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