function addOption(theSel, theText, theValue)
{
	var newOpt = new Option(theText, theValue);
	var selLength = theSel.length;
	theSel.options[selLength] = newOpt;
};

function deleteOption(theSel, theIndex) {	
	var selLength = theSel.length;
	if(selLength>0)
	{
		theSel.options[theIndex] = null;
	}
};

function moveOptions(theSelFrom, theSelTo) {
	
	var selLength = theSelFrom.length;
	var selectedText = new Array();
	var selectedValues = new Array();
	var selectedCount = 0;
	
	var i;
	
	// Find the selected Options in reverse order
	// and delete them from the 'from' Select.
	for(i=selLength-1; i>=0; i--)
	{
		if(theSelFrom.options[i].selected)
		{
			selectedText[selectedCount] = theSelFrom.options[i].text;
			selectedValues[selectedCount] = theSelFrom.options[i].value;
			deleteOption(theSelFrom, i);
			selectedCount++;
		}
	}
	
	// Add the selected text/values in reverse order.
	// This will add the Options to the 'to' Select
	// in the same order as they were in the 'from' Select.
	for(i=selectedCount-1; i>=0; i--)
	{
		addOption(theSelTo, selectedText[i], selectedValues[i]);
	}
};


function placeInHidden(delim, selStr, hidStr) {
  var selObj = document.getElementById(selStr);
  var hideObj = document.getElementById(hidStr);
  hideObj.value = '';
  for (var i=0; i<selObj.options.length; i++) {
    hideObj.value = hideObj.value ==
      '' ? selObj.options[i].value : hideObj.value + delim + selObj.options[i].value;
  }
};

function finalPlace(delim, selStr1, hidStr1, selStr2, hidStr2, selStr3, hidStr3) {
	placeInHidden(delim, selStr1, hidStr1);
	placeInHidden(delim, selStr2, hidStr2);
	placeInHidden(delim, selStr3, hidStr3);
};

function deleteSelected(delim,selStr,hidStr) {
	var selObj=document.getElementById(selStr);
	var hideObj=document.getElementById(hidStr);
	hideObj.value='';
	for (var i=selObj.options.length;i>=0;i--){
		if (selObj.options[i].selected){
		    hideObj.value = hideObj.value ==
			'' ? selObj.options[i].value : hideObj.value + delim + selObj.options[i].value;	
			deleteOption(selObj, i);
		}
	}
};