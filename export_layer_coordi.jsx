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
    // for (var i = 0; i < doc.layers.length; i++) {
    //     var layer = doc.layers[i];
    //     layer.visible = false;
    // }
    var targetLayer = findLayerByName(doc, 'left');
    if (targetLayer != null) {
        saveImage(targetLayer, 'left');
    }

    var allLayers = [];
    var allLayers = collectAnswerLayers(doc, allLayers);

    // alert("layers: " + allLayers);

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
    var filename = inputFile.toString().replace(/^.*[\\\/]/, '')
    map[filename] = coordiList;
    alert(map.toSource());


    // https://forums.adobe.com/thread/1891201

    // Make output folders
    // var outputPath = app.activeDocument.path+"/icon_output";
    // var rootdir = Folder(outputPath);
    // if(!rootdir.exists) rootdir.create();

    // var dirstore = Folder(outputPath+"/store");




    // Clean up
    app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
    // Delete the original
    // if (cleanup) inputFile.remove();

    // alert("Done!");
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

function saveImage(layer, fileName) {
    var filePath = Folder(app.activeDocument.fullName.parent).fsName + '\\' + fileName + '.jpg';
    var file = new File(filePath);
    // app.activeDocument.saveAs(file, prefs.formatArgs, true, Extension.LOWERCASE);
    quick_export_png(Folder(app.activeDocument.fullName.parent).fsName + '\\' + fileName + '.png', layer);
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
        executeAction(stringIDToTypeID(isLayer ? "exportSelectionAsFileTypePressed" : "exportDocumentAsFileTypePressed"), d, DialogModes.NO);
        activeDocument.activeLayer = layer0;
    }
    catch (e) { throw (e); }
}

function selectLayer(layer) {
    var idslct = charIDToTypeID("slct");
    var desc258 = new ActionDescriptor();
    var idnull = charIDToTypeID("null");
    var ref148 = new ActionReference();
    var idLyr = charIDToTypeID("Lyr ");
    ref148.putIndex(idLyr, layer.itemIndex);
    desc258.putReference(idnull, ref148);
    executeAction(idslct, desc258, DialogModes.NO);
    return desc258;
}



function getExportSelectedLayer(layer) {
    var path = activeDocument.path.fsName;
    try {
        var desc = new ActionDescriptor();
        var ref = new ActionReference();
        ref.putEnumerated(stringIDToTypeID("layer"), stringIDToTypeID("ordinal"), stringIDToTypeID("targetEnum"));
        desc.putReference(stringIDToTypeID("null"), ref);
        desc.putString(stringIDToTypeID("fileType"), "png");
        desc.putInteger(stringIDToTypeID("quality"), 32);
        desc.putInteger(stringIDToTypeID("metadata"), 0);
        desc.putString(stringIDToTypeID("destFolder"), path);
        desc.putBoolean(stringIDToTypeID("sRGB"), true);
        desc.putBoolean(stringIDToTypeID("openWindow"), false);

        executeAction(stringIDToTypeID("exportSelectionAsFileTypePressed"), desc, DialogModes.NO);

        return path + '/' + layer.name;

    } catch (e) {
        return '';
    }
}