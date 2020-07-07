// View Model to handle the matrices ordering via drag interaction

/* Authors: Bharat Kale <bkale@niu.edu>
			
   Version: 1.0.0
   Date: 06-01-2020
*/
"use strict"

var App = App || {};

let MatrixVisOrdering = function() {

	let self = {
		targetId: "",
		targetEle: null,
		data: null,

		margin: null,
		
		xScale: null,
		yScale: null,
		xScaleReverse: {},
		yScaleReverse: {},
		row: "",
		column: "",
		cellCls: "",
		rowLblCls: "",
		colLblCls: "",
		rowLblsAngle: 0,
		colLblsAngle: 0,

		selectedColLabels: new Set(),
		selectedRowLabels: new Set(),

		draggedPositions: {},
		dragStartPosition: [],
		dragDirection: '',

		maxPosition: 0,
		minPosition: 0,

		line: d3.line().x(d => d[0]).y(d => d[1]),
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

	function setXScale(scale) {
		self.xScale = scale;
		return this;
	}

	function setYScale(scale) {
		self.yScale = scale;
		return this;
	}

	function setRowAttribute(attr) {
		self.row = attr;
		return this;
	}

	function setColumnAttribute(attr) {
		self.column = attr;
		return this;
	}

	function setCellClass(cls) {
		self.cellCls = cls;
		return this;
	}

	function setRowLabelClass(cls) {
		self.rowLblCls = cls;
		return this;
	}

	function setColLabelClass(cls) {
		self.colLblCls = cls;
		return this;
	}

	function setRowLabelRotation(angle) {
		self.rowLblsAngle = angle;
		return this;
	}

	function setColumnLabelRotation(angle) {
		self.colLblsAngle = angle;
		return this;
	}

	function dragCellStarted(d) {
		d3.select(this).raise().classed("matrixActive", true);
		self.dragStartPosition = [d3.event.x, d3.event.y]
	}

	function draggedCell(d) {
		var curPos = [d3.event.x, d3.event.y];
		if (self.dragDirection == '') {
			if(Math.abs(curPos[0]-self.dragStartPosition[0])>0) {
				self.dragDirection = 'x';
			} else if(Math.abs(curPos[1]-self.dragStartPosition[1])>0) {			
				self.dragDirection = 'y';
			}
		} else {
			var cells = d3.selectAll(`.${self.cellCls}`),
				colLabels = d3.selectAll(`.${self.colLblCls}`),
				rowLabels = d3.selectAll(`.${self.rowLblCls}`);
			
			if (self.dragDirection == 'x') {
				self.draggedPositions[d[self.column]] = self.xScale(d[self.column])+self.xScale.bandwidth()/2
				d3.selectAll(`.cell_${format(d[self.column])}`).raise().classed("matrixActive", true);

				self.draggedPositions[d[self.column]] = Math.min(self.xScale.range()[1], Math.max(0, d3.event.x))
				var sortedDomain = [...new Set(self.data.map(d => d[self.column]))].sort((a, b) => xPosition(a) - xPosition(b));
				self.xScale.domain(sortedDomain)

				cells.transition().duration(100)
					.attr("transform", d => `translate(${xPosition(d[self.column])}, ${self.yScale(d[self.row])+self.yScale.bandwidth()/2})`)
				colLabels.transition().duration(100)
					.attr("transform", d => `translate(${xPosition(d)}, ${-self.margin.top*0.08})rotate(${self.colLblsAngle})`)

			} else {
				self.draggedPositions[d[self.row]] = self.yScale(d[self.row])+self.yScale.bandwidth()/2
				d3.selectAll(`.cell_${d[self.row]}`).raise().classed("matrixActive", true);

				self.draggedPositions[d[self.row]] = Math.min(self.yScale.range()[1], Math.max(0, d3.event.y))
				var sortedDomain = [...new Set(self.data.map(d => d[self.row]))].sort((a, b) => yPosition(a) - yPosition(b));
				self.yScale.domain(sortedDomain)

				cells.transition().duration(100)
					.attr("transform", d => `translate(${self.xScale(d[self.column])+self.xScale.bandwidth()/2}, ${yPosition(d[self.row])})`)
				rowLabels.transition().duration(100)
					.attr("transform", d => `translate(-5, ${yPosition(d)})rotate(${self.rowLblsAngle})`)
			}
		}
	}

	function dragCellEnded(d) {

		self.dragStartPosition = [];
		self.dragDirection = '';
		self.draggedPositions = {};

		d3.selectAll(`.${self.colLblCls}`).transition()
			.duration(500)
			.attr("transform", d => `translate(${xPosition(d)}, ${-self.margin.top*0.08})rotate(${self.colLblsAngle})`)

		d3.selectAll(`.${self.rowLblCls}`).transition()
			.duration(500)
			.attr("transform", d => `translate(-5, ${yPosition(d)})rotate(${self.rowLblsAngle})`)

		d3.selectAll(`.${self.cellCls}`).transition()
			.duration(500)
			.attr("transform", d => `translate(${self.xScale(d[self.column])+self.xScale.bandwidth()/2}, ${self.yScale(d[self.row])+self.yScale.bandwidth()/2})`)

		d3.select(this).classed("matrixActive", false);
		d3.selectAll(`.${self.cellCls}`).raise().classed("matrixActive", false);
	}

	function dragRowLabelsStarted() {
		self.yScale.domain().forEach(d => self.yScaleReverse[d]=[self.yScale(d), self.yScale(d)+self.yScale.bandwidth()]);
		// draggedRowLabels();
	}

	function draggedRowLabels() {
		for (var key in self.yScaleReverse) {
			if (self.yScaleReverse[key][0] <= d3.event.y && d3.event.y <= self.yScaleReverse[key][1]) {
				d3.select(`#row_${format(key)}`).classed('selectedLabel', true);				
				self.selectedRowLabels.add(key);
			}
		}	
	}

	function dragRowLabelsEnded() {
		var subsetKeys = getOptimalOrder(self.selectedRowLabels, 'row'),
			sortedKeys = [],
			i = 0;
		for (var key in self.yScaleReverse) {
			if (subsetKeys.includes(key)) {
				sortedKeys.push(subsetKeys[i]);
				++i;
			} else {
				sortedKeys.push(key);
			}
		}
		self.yScale.domain(sortedKeys);
		updateMatrix();		
	}

	function dragColLabelsStarted() {	
		self.xScale.domain().forEach(d => self.xScaleReverse[d]=[self.xScale(d), self.xScale(d)+self.xScale.bandwidth()]);	
		// draggedColLabels();
	}

	function draggedColLabels() {	
		for (var key in self.xScaleReverse) {
			if (self.xScaleReverse[key][0] <= d3.event.x && d3.event.x <= self.xScaleReverse[key][1]) {
				self.targetEle.select(`#col_${format(key)}`).classed('selectedLabel', true);
				self.selectedColLabels.add(key);
			}
		}
	}

	function dragColLabelsEnded() {
		var subsetKeys = getOptimalOrder(self.selectedColLabels, 'column'),
			sortedKeys = [],
			i = 0;
		for (var key in self.xScaleReverse) {
			if (subsetKeys.includes(key)) {
				sortedKeys.push(subsetKeys[i]);
				++i;
			} else {
				sortedKeys.push(key);
			}
		}
		self.xScale.domain(sortedKeys);
		updateMatrix();
	}

	
	///////// Helper methods (Private) /////////

	// To determine x and y positions of a cell and the labels
	function xPosition(d) {
	  	var newP = self.draggedPositions[d];
	  	return newP == null ? self.xScale(d)+self.xScale.bandwidth()/2 : newP;
	}

	function yPosition(d) {
	  	var newP = self.draggedPositions[d];
	  	return newP == null ? self.yScale(d)+self.yScale.bandwidth()/2 : newP;
	}

	function format(str) {
		return str.replace(/\W/g, '');
	}

	function getOptimalOrder(subset, filterBy) {
		var subsetData;
		if (filterBy=='column') {
			subsetData = d3.nest()
							.key(d => d[self.column])
  							.rollup(v => v.map(k => +k.normalizedValue))
							.entries(self.data.filter(d => subset.has(d[self.column])))
		} else {
			subsetData = d3.nest()
							.key(d => d[self.row])
  							.rollup(v => v.map(k => +k.normalizedValue))
							.entries(self.data.filter(d => subset.has(d[self.row])))
		}
		
		subsetData.sort((d1, d2) => {
			return Math.sqrt(d1.value.reduce((sum, val) => (sum + Math.pow(val,2)),0)) - Math.sqrt(d2.value.reduce((sum, val) => (sum + Math.pow(val,2)),0));
		})
		
		return subsetData.map(d => d.key);
	}

	function updateMatrix() {
		d3.selectAll(`.${self.cellCls}`)
			.transition()
				.duration(1000)
				.attr("transform", d => `translate(${self.xScale(d[self.column])+self.xScale.bandwidth()/2}, ${self.yScale(d[self.row])+self.yScale.bandwidth()/2})`)

		d3.selectAll(`.${self.colLblCls}`)
			.transition()
				.duration(1000) 
				.attr("transform", d => `translate(${self.xScale(d)+self.xScale.bandwidth()/2}, ${-self.margin.top*0.08})rotate(${self.colLblsAngle})`)

		d3.selectAll(`.${self.rowLblCls}`)
			.transition()
				.duration(1000) 
				.attr("transform", d => `translate(-5, ${self.yScale(d)+self.yScale.bandwidth()/2})rotate(${self.rowLblsAngle})`)
	}

	return {
		setTargetId,
		setData,
		setMargin,
		setXScale,
		setYScale,
		setRowAttribute,
		setColumnAttribute,
		setCellClass,
		setRowLabelClass,
		setColLabelClass,
		setRowLabelRotation,
		setColumnLabelRotation,

		dragCellStarted,
		draggedCell,
		dragCellEnded,

		dragRowLabelsStarted,
		draggedRowLabels,
		dragRowLabelsEnded,

		dragColLabelsStarted,
		draggedColLabels,
		dragColLabelsEnded,

		// getData,
		// getScales,
	};
}