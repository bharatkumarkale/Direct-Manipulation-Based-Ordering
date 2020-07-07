var App = App || {};

(function() {

	App.models = {};
	App.views = {};

	App.init = function() {
		App.models.data = new DataModel();
		App.views.barChartView = new BarChartView("#barChartContent")
		App.views.matrixView = new MatrixView("#matrixVisContent")

		App.models.data.loadBarChartData().then(data => {
				App.views.barChartView.data(App.models.data.getBarChartData())
					.draw();
		})

		App.models.data.loadMatrixData().then(data => {
				App.views.matrixView.data(App.models.data.getMatrixData())
					.draw();
		})
	}
})();