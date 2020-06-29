var App = App || {};

(function() {

	App.models = {};
	App.views = {};
	App.targetID = '#displayPane';

	App.init = function() {
		App.models.data = new DataModel();
		App.views.simpleBarChartView = new SimpleBarChartView(App.targetID)
		App.views.groupBarChartView = new GroupBarChartView(App.targetID)
		App.views.matrixView = new MatrixView(App.targetID)

		App.models.data.loadSimpleBarChartData().then(data => {
			App.views.simpleBarChartView.data(App.models.data.getSimpleBarChartData()).draw();
		})

		App.models.data.loadGroupedBarChartData().then(data => {
			App.views.groupBarChartView.data(App.models.data.getGroupedBarChartData());	
		})

		App.models.data.loadMatrixData().then(data => {
			App.views.matrixView.data(App.models.data.getMatrixData());
		})
	}

	App.onDemoSelectionChange = function(id, descId, instructionsId) {
		var selectedEle = document.getElementById(id),
			descEle = document.getElementById(descId),
			instructionsEle = document.getElementById(instructionsId),
			descText = 'Possible tasks include:<br><ol>',
			instructionsText = '<ul>';

		clearView();

		switch(selectedEle.value) {
			case "groupedbar":
				descText += '<li>Order groups in any order of your preference.</li>'
				descText += '<li>Order all bars in all groups in ascending/descending order.</li>'
				descText += '<li>Order all bars in one or more selected groups in ascending/descending order.</li>'
				descText += '<li>Order all/selected groups in ascending/descending order based on chosen sub-type.</li>'

				instructionsText += '<li>Drag the tallest bar to right most boundary to sort in ascending order.</li>';
				instructionsText += '<li>Drag the tallest bar to left most boundary to sort in descending order.</li>';
				instructionsText += '<li>Double click a bar to select, and all the bars of same type across the groups are also selected. Click on the group titles to select entire group. Click any where else to clear the selection.</li>';
				instructionsText += '<li>Use the tallest bar in the selection to reorder only the selected bars.</li>';
				
				if (App.views.groupBarChartView)
					App.views.groupBarChartView.data(App.models.data.getGroupedBarChartData()).draw();	

				break;

			case "matrix":
				descText += '<li>Order rows in any order of your preference</li>'
				descText += '<li>Order columns in any order of your preference</li>'
				descText += '<li>Order a set of rows and columns to reveal the clusters</li>'

				instructionsText += '<li>Drag any cell to left/right to reorder the corresponding column.</li>';
				instructionsText += '<li>Drag any cell to top/bottom to reorder the corresponding row.</li>';
				instructionsText += '<li>Draw along row headers to reorder the corresponding columns based on their visual similarity.</li>';
				instructionsText += '<li>Draw along column headers to reorder the corresponding rows based on their visual similarity.</li>';
				
				if (App.views.matrixView)
					App.views.matrixView.data(App.models.data.getMatrixData()).draw();

				break;

			case "simplebar":
			default:
				descText += '<li>Order bars in any order of your preference.</li>'
				descText += '<li>Order all bars in ascending/descending order.</li>'
				descText += '<li>Make a selection of few neighbouring bars. Order all the selected bars in ascending/descending order.</li>'
				descText += '<li>Make a selection of few non-neighbouring bars. Order all the selected bars in ascending/descending order.</li>'
				
				instructionsText += '<li>Drag the tallest bar to right most boundary to sort in ascending order.</li>';
				instructionsText += '<li>Drag the tallest bar to left most boundary to sort in descending order.</li>';
				instructionsText += '<li>Double click a bar to select it. Click any where else to clear the selection.</li>';
				instructionsText += '<li>Use the tallest bar in the selection to reorder only the selected bars.</li>';

				if (App.views.simpleBarChartView)
					App.views.simpleBarChartView.data(App.models.data.getSimpleBarChartData()).draw();

		}
		descText += '</ol>';
		instructionsText += '</ul>';

		descEle.innerHTML = descText;
		instructionsEle.innerHTML = instructionsText;
	}

	function clearView() {
		if (App.views.simpleBarChartView) App.views.simpleBarChartView.clear();
		if (App.views.matrixView) App.views.groupBarChartView.clear();
		if (App.views.groupBarChartView) App.views.matrixView.clear();
	}

})();