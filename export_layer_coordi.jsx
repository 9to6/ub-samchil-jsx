/*
// BEGIN__HARVEST_EXCEPTION_ZSTRING
<javascriptresource>
<name>$$$/JavaScripts/GetCoorde/MenuAlt=Get Coordi on Layer</name>
<category>mobile</category>
</javascriptresource>
// END__HARVEST_EXCEPTION_ZSTRING
*/

// bring Photoshop into focus
#target photoshop

var prefs = new Object();
config();
main();

function config() {
    prefs = new Object();
    prefs.format = "";
    prefs.fileExtension = "";
    try {
        prefs.filePath = app.activeDocument.path;
    } catch (e) {
        prefs.filePath = Folder.myDocuments;
    }
    prefs.formatArgs = null;
    prefs.outputPrefix = "";
    prefs.outputSuffix = "";
    prefs.replaceSpaces = true;
    prefs.delimiter = '_';
    prefs.bgLayer = false;
    prefs.fgLayer = false;
    prefs.scale = false;
    prefs.scaleValue = 100;
    prefs.forceTrimMethod = false;
    prefs.groupsAsFolders = true;
    prefs.overwrite = false;
    prefs.padding = false;
    prefs.paddingValue = 1;
    prefs.ignoreLayersString = "!";
    prefs.ignoreLayers = false;


    prefs.format = "JPG";
    prefs.fileExtension = ".jpg";
    prefs.formatArgs = new JPEGSaveOptions();
    prefs.formatArgs.quality = 7;
    prefs.formatArgs.matte = MatteType.WHITE; // default 
    prefs.formatArgs.FormatOptions = FormatOptions.STANDARDBASELINE;
    prefs.scaleValue = 50;
}

function main() {

    // var cleanup = confirm("This script outputs Android store, SHDPI, HDPI, "
    //                     + "MDPI, and LDPI icons from a source PSD at least 512px x "
    //                     + "512px\r\r"
    //                     + "Do you want to delete your original files when "
    //                     + "complete?");

    // Ask user for input folder
    var inputFile = File.openDialog("Select a PSD file to get coordinate of layers", "PNG File:*.psd");
    if (inputFile == null) throw "No file selected. Exting script.";

    // Open file
    open(inputFile);
    var doc = app.activeDocument;
    for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        layer.visible = false;
    }

    var docName = doc.name;
    if (docName.indexOf(".") != -1) { var basename = docName.match(/(.*)\.[^\.]+$/)[1] }
    else { var basename = docName };
    // getting the location, if unsaved save to desktop;
    try { var docPath = doc.path }
    catch (e) { var docPath = "~/Desktop" };
    // create folder if it does not exist;  
    var folderString = docPath + "/" + basename;
    if (Folder(folderString).exists == false) { new Folder(folderString).create() };

    scaleImage();
    {
        var targetLayer = findLayerByName(doc, 'origin');
        if (targetLayer != null) {
            targetLayer.visible = true;
            saveImage(targetLayer, folderString, 'origin');
            targetLayer.visible = false;
        }
    }
    {
        var targetLayer = findLayerByName(doc, 'result');
        if (targetLayer != null) {
            targetLayer.visible = true;
            saveImage(targetLayer, folderString, 'result');
            targetLayer.visible = false;
        }
    }

    var allLayers = [];
    var allLayers = collectAnswerLayers(doc, allLayers);

    var coordiList = [];
    for (var i = 0; i < allLayers.length; i++) {
        var theLayer = allLayers[i];
        if (theLayer.kind !== LayerKind.SMARTOBJECT) {
            alert('Have to be layer type is SmartObject');
            break;
        }
        var ret = getLayerBounds(theLayer);
        coordiList.push(ret);
    }
    var map = {};
    map[basename] = coordiList;
    var str = map.toSource();
    str = str.substring(1, str.length-1);
    saveCoordi(folderString, str);

    // Clean up
    app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
}

function collectAnswerLayers(doc, allLayers) {
    for (var m = 0; m < doc.layers.length; m++) {
        var theLayer = doc.layers[m];
        if (theLayer.typename === "ArtLayer") {
            if (theLayer.name.indexOf('Answer') >= 0) {
                allLayers.push(theLayer);
            }
        } else {
            collectAnswerLayers(theLayer, allLayers);
        }
    }
    return allLayers;
}

function collectAllLayers(doc, allLayers) {
    for (var m = 0; m < doc.layers.length; m++) {
        var theLayer = doc.layers[m];
        if (theLayer.typename === "ArtLayer") {
            allLayers.push(theLayer);
        } else {
            collectAllLayers(theLayer, allLayers);
        }
    }
    return allLayers;
}

function getLayerBounds(layer) {
    try {
        var layer0 = activeDocument.activeLayer;
        activeDocument.activeLayer = layer;

        var r = new ActionReference();
        r.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));

        var d = executeActionGet(r).getObjectValue(stringIDToTypeID("smartObjectMore")).getList(stringIDToTypeID("transform"));
        // var d = executeActionGet(r).getObjectValue(stringIDToTypeID(layer.name));

        var x = [d.getDouble(0), d.getDouble(2), d.getDouble(4), d.getDouble(6)];
        var y = [d.getDouble(1), d.getDouble(3), d.getDouble(5), d.getDouble(7)];

        var l = [Math.min(x[0], Math.min(x[1], Math.min(x[2], x[3])))];
        var r = [Math.max(x[0], Math.max(x[1], Math.max(x[2], x[3])))];

        var t = [Math.min(y[0], Math.min(y[1], Math.min(y[2], y[3])))];
        var b = [Math.max(y[0], Math.max(y[1], Math.max(y[2], y[3])))];

        activeDocument.activeLayer = layer0;

        return [UnitValue(l, "px").value, UnitValue(t, "px").value, UnitValue(r, "px").value, UnitValue(b, "px").value];
    }
    catch (e) { alert(e); }
}

function findLayerByName(doc, layerName) {
    for (var m = 0; m < doc.layers.length; m++) {
        var layer = doc.layers[m];
        if (layer.typename === "ArtLayer" &&
            layer.name.indexOf(layerName) >= 0) {
            return layer;
        }
    }
    return null;
}

function scaleImage() {
    var width = app.activeDocument.width.as("px") * (prefs.scaleValue / 100.0);
    app.activeDocument.resizeImage(UnitValue(width, "px"), null, null, ResampleMethod.BICUBICSHARPER);
}

function saveImage(layer, dir, fileName) {
    var filePath = dir + '\\' + fileName + '.jpg';
    var file = new File(filePath);
    app.activeDocument.saveAs(file, prefs.formatArgs, true, Extension.LOWERCASE);
    // quick_export_png(Folder(app.activeDocument.fullName.parent).fsName + '\\' + fileName + '.png', layer);
}

function quick_export_png(path, layer) {
    try {
        var layer0 = activeDocument.activeLayer;
        activeDocument.activeLayer = layer;

        // selectLayer(layer);
        // getExportSelectedLayer(layer);

        var d = new ActionDescriptor();
        var r = new ActionReference();

        // r.putEnumerated(stringIDToTypeID("layer"), stringIDToTypeID("ordinal"), stringIDToTypeID("targetEnum"));
        r.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
        d.putReference(stringIDToTypeID("null"), r);

        d.putString(stringIDToTypeID("fileType"), "png");
        d.putInteger(stringIDToTypeID("quality"), 32);
        d.putInteger(stringIDToTypeID("metadata"), 0);
        d.putString(stringIDToTypeID("destFolder"), path);
        d.putBoolean(stringIDToTypeID("sRGB"), true);
        d.putBoolean(stringIDToTypeID("openWindow"), false);

        var isLayer = true
        var ret = executeAction(stringIDToTypeID(isLayer ? "exportSelectionAsFileTypePressed" : "exportDocumentAsFileTypePressed"), d, DialogModes.NO);
        activeDocument.activeLayer = layer0;
    }
    catch (e) { throw (e); }
}

function resizeImage(layer, x, y, res) { //[width , height, resolution]
    var layer0 = activeDocument.activeLayer;
    activeDocument.activeLayer = layer;
    function cTID(s) { return app.charIDToTypeID(s); };
    function sTID(s) { return app.stringIDToTypeID(s); };

    var desc3167 = new ActionDescriptor();
    desc3167.putUnitDouble(cTID('Wdth'), cTID('#Pxl'), x);
    desc3167.putUnitDouble(cTID('Hght'), cTID('#Pxl'), y);
    desc3167.putUnitDouble(cTID('Rslt'), cTID('#Rsl'), res);
    desc3167.putEnumerated(cTID('Intr'), cTID('Intp'), sTID('bicubicAutomatic'));
    executeAction(cTID('ImgS'), desc3167, DialogModes.NO);
    activeDocument.activeLayer = layer0;
}; 

function saveCoordi(dir, json) {
    var jsonFile = new File(dir + '\\' + 'coordi.json');
    jsonFile.encoding = "UTF-8";
    jsonFile.remove();
    jsonFile.open("w", "TEXT");
    jsonFile.lineFeed = "\n";
    jsonFile.write(json);
    jsonFile.close();
}