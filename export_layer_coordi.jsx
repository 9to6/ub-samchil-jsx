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
    prefs.outputDir = 'output';
}

function getFilesInFolder(start, end) {
    var path = '/z/FileServer/dev/projects/ud-samchil/images/easymode';
    function pad(num) {
        var formattedNumber = ("00" + num).slice(-3);
        return formattedNumber;
    }
    ret = [];
    for (var i = start; i <= end; i++) {
        var formatNum = pad(i);
        ret.push(path + '/' + formatNum + '.psd');
    }
    return ret;
}

function main() {
    var inputFile = File.openDialog("Select a PSD file to get coordinate of layers", "PNG File:*.psd");
    if (inputFile == null) throw "No file selected. Exting script.";
    run(inputFile);

    // var filePathList = getFilesInFolder(23, 50);
    // for (var i = 0; i < filePathList.length; i++) {
    //     run(filePathList[i]);
    // }
    // Open file
}

function run(inputFile) {
    if ( typeof inputFile == "string" ) {
        open(new File(inputFile));
    } else {
        open(inputFile);
    }
    var doc = app.activeDocument;

    doc.activeLayer = app.activeDocument.artLayers.getByName("origin");
    var layer = findLayerByName(doc, 'size');
    var coord = getLayerBounds(layer);
    doc.selection.select([[coord[0], coord[1]], [coord[0], coord[3] - coord[1]],
    [coord[2], coord[3] - coord[1]], [coord[2], coord[1]]]);
    crop();
    // var fillColor = new SolidColor();
    // fillColor.rgb.red = 255;
    // fillColor.rgb.green = 0;
    // fillColor.rgb.blue = 0;
    // app.activeDocument.selection.fill(fillColor, ColorBlendMode.VIVIDLIGHT, 25, false);

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
    var folderString = docPath + "/output";
    if (Folder(folderString).exists == false) { new Folder(folderString).create() };
    prefs.outputDir = folderString;
    var folderString = folderString + "/" + basename;
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
        coordiList.push(transformBoundToRect(ret));
    }
    var map = {};
    map['"'+basename+'"'] = coordiList;
    var str = map.toSource();
    str = str.substring(1, str.length - 1);
    str = str.replace(/\\"/gi, "");
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

function transformBoundToRect(ary) {
    return [ary[0], ary[1], ary[2] - ary[0], ary[3] - ary[1]];
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

        return [Math.floor(UnitValue(l, "px").value), Math.floor(UnitValue(t, "px").value), Math.floor(UnitValue(r, "px").value), Math.floor(UnitValue(b, "px").value)];
    }
    catch (e) { alert(e); }
}

function findLayerByName(doc, layerName) {
    for (var m = 0; m < doc.layers.length; m++) {
        var layer = doc.layers[m];
        if (layer.typename === "ArtLayer" &&
            layer.name.indexOf(layerName) >= 0 &&
            layer.name.length == layerName.length) {
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

function selectMask(LayerName) {
    try {
        var desc = new ActionDescriptor();
        var ref = new ActionReference();
        ref.putEnumerated(charIDToTypeID('Chnl'), charIDToTypeID('Chnl'), charIDToTypeID('Msk '));
        ref.putName(charIDToTypeID('Lyr '), LayerName);
        desc.putReference(charIDToTypeID('null'), ref);
        desc.putBoolean(charIDToTypeID('MkVs'), true);
        executeAction(charIDToTypeID('slct'), desc, DialogModes.NO);

        // =======================================================
        var id1083 = charIDToTypeID("setd");
        var desc238 = new ActionDescriptor();
        var id1084 = charIDToTypeID("null");
        var ref161 = new ActionReference();
        var id1085 = charIDToTypeID("Chnl");
        var id1086 = charIDToTypeID("fsel");
        ref161.putProperty(id1085, id1086);
        desc238.putReference(id1084, ref161);
        var id1087 = charIDToTypeID("T   ");
        var ref162 = new ActionReference();
        var id1088 = charIDToTypeID("Chnl");
        var id1089 = charIDToTypeID("Ordn");
        var id1090 = charIDToTypeID("Trgt");
        ref162.putEnumerated(id1088, id1089, id1090);
        desc238.putReference(id1087, ref162);
        executeAction(id1083, desc238, DialogModes.NO);
    }
    catch (e) {
        //alert(e)
        alert("This layer has NO layer mask!");
        activeDocument.selection.deselect();
    }
} //end function

function selectLayerByIndex(index, add) {
    add = false;
    var r = new ActionReference();
    r.putIndex(charIDToTypeID("Lyr "), index);
    // r.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"));
    var desc = new ActionDescriptor();
    desc.putReference(charIDToTypeID("null"), r);
    if (add) desc.putEnumerated(stringIDToTypeID("selectionModifier"), stringIDToTypeID("selectionModifierType"), stringIDToTypeID("addToSelection"));

    desc.putBoolean(charIDToTypeID("MkVs"), false);
    try {
        executeAction(charIDToTypeID("slct"), desc, DialogModes.NO);
    } catch (e) {
        alert(e.message);
    }
};

function crop() {
    function cTID(s) { return app.charIDToTypeID(s); };
    var desc001 = new ActionDescriptor();
    executeAction(cTID('Crop'), desc001, DialogModes.NO);
}  

function loadSelection(layer) {
    try {
        var layer0 = activeDocument.activeLayer;
        activeDocument.activeLayer = layer;

        sTT = stringIDToTypeID;
        (ref1 = new ActionReference()).putProperty(c = sTT('channel'), sTT('selection'));
        (dsc = new ActionDescriptor()).putReference(sTT('null'), ref1);
        (ref2 = new ActionReference()).putEnumerated(c, c, sTT('transparencyEnum'))
        dsc.putReference(sTT('to'), ref2), executeAction(sTT('set'), dsc);
        activeDocument.activeLayer = layer0;
    }
    catch (e) { throw (e); }
}