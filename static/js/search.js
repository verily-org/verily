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