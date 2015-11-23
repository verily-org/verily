function search (str, role) {
	var basic_sel = document.getElementById(role);
	var hint = '';
	var index;
	if (str.length > 0) {
		for (var i = 0; i < basic_sel.options.length; i++) {
			if (str.toUpperCase() === basic_sel.options[i].value.substring(0, str.length).toUpperCase()) {
                    hint = i;
                    break;
        	}
		}
		if (hint !== '') {
            basic_sel.selectedIndex = hint;
        } else {
            basic_sel.selectedIndex = -1;
       }	

	}
}

function server_search (str, url, select_id)
{
    url = url.replace(/\$1/g, str);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() { // (3)
    if (xhr.readyState != 4) return;

    if (xhr.status != 200) {
    } else {
      var res = JSON.parse(xhr.responseText);
      var select = document.getElementById(select_id);
      select.innerHTML = "";
      res.forEach(function(v, i, arr) {
          select.innerHTML += "<option value=\""+v.id+"\">"+v.tag_name+"</option>";
      });
    }

  };
  xhr.send();

}