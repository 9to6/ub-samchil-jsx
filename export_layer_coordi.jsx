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

main();

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
    var docRef = app.activeDocument;

    var doc = app.activeDocument;
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

function getTransformMatrix2by2() {
    var ref = new ActionReference();
    ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    var desc = executeActionGet(ref).getObjectValue(stringIDToTypeID('textKey'));
    if (desc.hasKey(stringIDToTypeID('transform'))) {
        var matrix = [['xx', 'xy'], ['yx', 'yy']];
        desc = desc.getObjectValue(stringIDToTypeID('transform'));
        for (var i = 0; i < matrix.length; i++) {
            var row = matrix[i];
            for (var j = 0; j < row.length; j++) {
                matrix[i][j] = desc.getDouble(stringIDToTypeID(matrix[i][j]));
            }
        }
        return matrix;
    }
    return undefined;
}