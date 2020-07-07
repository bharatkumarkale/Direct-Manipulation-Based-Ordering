// View Model to handle the bar chart ordering via drag interaction

/* Authors: Bharat Kale <bkale@niu.edu>
			
   Version: 1.0.0
   Date: 05-28-2020
*/
"use strict"

var App = App || {};

let GroupBarChartOrdering = function() {

	let self = {
		targetId: "",
		targetEle: null,
		data: null,

		margin: null,
		
		xScaleGroup: null,
		xScaleBar: null,
		yScale: null,
		xAttr: "",
		yAttr: "",
		
		xTickCls: "",
		yTickClas: "",

		bars: null,
		selectedBars: [],
		selectedRange: [],
		draggedPositions: {},

		maxPosition:0,
		minPosition:0,
	};

	function setTargetId(id) {
		self.targetId = id;
		self.targetEle = d3.selectAll(`#${id}`).selectAll('svg');
		return this;
	}

	function setData(data) {
		self.data = data;
		return this;
	}

	function setMargin(margin) {
		self.margin = margin;
		return this;
	}

	function setBars(bars) {
		self.bars = bars;
		return this;
	}

	function setSelection(sel) {
		self.selectedBars = sel;
		// if (self.selectedBars.length==2) {
		// 	getAllBarsInRange();
		// 	self.targetEle.selectAll('.barRect').classed("barSemiActive", function (d) {
		// 		if (self.selectedRange.map(d => d[self.xAttr]).includes(d[self.xAttr]) && 
		// 			! self.selectedBars.map(d => d[self.xAttr]).includes(d[self.xAttr])) {
		// 			return true;
		// 		} else {
		// 			return false;
		// 		}
		// 	});
		// } else {
		// 	self.targetEle.selectAll('.barSemiActive').classed("barSemiActive", false);
		// }
		return this;
	}

	function setXGroupScale(scale) {
		self.xScaleGroup = scale;
		return this;
	}

	function setXBarScale(scale) {
		self.xScaleBar = scale;
		return this;
	}

	function setYScale(scale) {
		self.yScale = scale;
		return this;
	}

	function setXAttribute(attr) {
		self.xAttr = attr;
		return this;
	}

	function setYAttribute(attr) {
		self.yAttr = attr;
		return this;
	}

	function setXTickClass(cls) {
		self.xTickCls = cls;
		return this;
	}

	function setYTickClass(cls) {
		self.yTickCls = cls;
		return this;
	}

	function getData() {
		return self.data
	}

	function getScales() {
		return [self.xScale, self.yScale]
	}

	return {
		setTargetId,
		setData,
		setMargin,
		setBars,
		setSelection,
		setXGroupScale,
		setXBarScale,
		setYScale,
		setXAttribute,
		setYAttribute,
		setXTickClass,
		setYTickClass,
		dragstarted,
		dragged,
		dragended,

		getData,
		getScales,
	};

}