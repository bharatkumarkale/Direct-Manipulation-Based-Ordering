// View Model to handle the bar chart ordering via drag interaction

/* Authors: Bharat Kale <bkale@niu.edu>
			
   Version: 1.0.0
   Date: 05-28-2020
*/
"use strict"

var App = App || {};

let SimpleBarChartOrdering = function() {

	let self = {
		targetId: "",
		targetEle: null,
		data: null,

		margin: null,
		
		xScale: null,
		yScale: null,
		xAttr: "",
		yAttr: "",
		
		xTickCls: "",
		yTickClas: "",

		bars: null,
		selectedBars: [],
		selectedRange: [],
		isSelectionConsecutive: true,
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
		if (self.selectedBars.length==2) {
			getAllBarsInRange();
			self.targetEle.selectAll('.barRect').classed("barSemiActive", function (d) {
				if (self.selectedRange.map(d => d[self.xAttr]).includes(d[self.xAttr]) && 
					! self.selectedBars.map(d => d[self.xAttr]).includes(d[self.xAttr])) {
					return true;
				} else {
					return false;
				}
			});
		} else {
			self.targetEle.selectAll('.barSemiActive').classed("barSemiActive", false);
		}
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

	function dragstarted(d) {
		var xScaleDomain = self.xScale.domain(),
			line = d3.line().x(d => d[0]).y(d => d[1]);

		if (self.selectedBars.includes(d)) {
			self.selectedBars.sort((a,b) => self.xScale(a[self.xAttr]) - self.xScale(b[self.xAttr]));
			for (var i = 0; i < self.selectedBars.length-1; i++) {
				var x1 = self.selectedBars[i][self.xAttr],
					x2 = self.selectedBars[i+1][self.xAttr]
				if(Math.abs(xScaleDomain.indexOf(x1)-xScaleDomain.indexOf(x2))!=1){
					self.isSelectionConsecutive = false;
					break;
				}
			}

			// if (self.selectedBars.length==2) {
			// 	// self.selectedRange = [];
			// 	// var startIndex = self.data.map(d => d[self.xAttr]).indexOf(self.selectedBars[0][self.xAttr]),
			// 	// 	endIndex = self.data.map(d => d[self.xAttr]).indexOf(self.selectedBars[1][self.xAttr]);
			// 	// for (var i = startIndex; i <= endIndex; i++) {
			// 	// 	self.selectedRange.push(self.data[i]);
			// 	// }
			// }

			// if (self.isSelectionConsecutive) {
				self.maxPosition = self.xScale(self.selectedBars[self.selectedBars.length-1][self.xAttr])+self.xScale.bandwidth()
				self.minPosition = self.xScale(self.selectedBars[0][self.xAttr])
			// }
		} else {
			self.maxPosition = self.xScale.range()[1]
			self.minPosition = self.xScale.range()[0]
		}

		self.minPosition -= self.xScale.padding()*self.xScale.bandwidth();
		self.maxPosition += self.xScale.padding()*self.xScale.bandwidth();

		self.targetEle.append("path")
			.datum([[self.minPosition+self.margin.left, self.yScale.range()[0]+self.margin.top],
					[self.minPosition+self.margin.left, self.margin.top]])
			.attr("d", line)
			.attr("class", "boundary")
		self.targetEle.append("path")
			.datum([[self.maxPosition+self.margin.left, self.yScale.range()[0]+self.margin.top],
					[self.maxPosition+self.margin.left, self.margin.top]])
			.attr("d", line)
			.attr("class", "boundary")

		self.minPosition -= self.xScale.bandwidth();
		self.draggedPositions[d[self.xAttr]] = self.xScale(d[self.xAttr])
		d3.select(this).raise().classed("barActive", true);
	}

	function dragged(d) {
		if (d3.event.x<self.maxPosition && d3.event.x>self.minPosition) {
			self.draggedPositions[d[self.xAttr]] = Math.min(self.xScale.range()[1], Math.max(0, d3.event.x))
			self.data.sort((a, b) => position(a) - position(b));
			self.xScale.domain(self.data.map(k => k[self.xAttr]))
			self.bars.attr('transform', d => `translate(${position(d)},${self.yScale(d[self.yAttr])})`);
			self.targetEle.selectAll(`.${self.xTickCls}`)
					.attr("x", d => self.margin.left+self.xScale(d)+self.xScale.bandwidth()/2);
			d3.select(this).attr('transform', d => `translate(${d3.event.x},${self.yScale(d[self.yAttr])})`);
		}
	}

	function dragended(d,i) {
		delete self.draggedPositions[d[self.xAttr]];
		d3.select(this).transition()
			.duration(500)
			.attr("transform", d => `translate(${position(d)},${self.yScale(d[self.yAttr])})`);
		d3.select(this).classed("barActive", false);

		if (d3.event.x>self.maxPosition) { 
			d3.select(this).select('rect').classed("mouseOver", false);
			// d[self.yAttr]==d3.max(self.data.map(k => k[self.yAttr])) ? sortAndUpdateRects(false) : "";
			sortAndUpdateRects(d, false);
		} else if (d3.event.x<self.minPosition) { 
			d3.select(this).select('rect').classed("mouseOver", false);
			// d[self.yAttr]==d3.max(self.data.map(k => k[self.yAttr])) ? sortAndUpdateRects(true) : "";
			sortAndUpdateRects(d, true);
		}

		self.targetEle.selectAll(`.${self.xTickCls}`)
			.transition()
				.duration(1000) 
				.attr("x", d => self.margin.left+self.xScale(d)+self.xScale.bandwidth()/2);
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
		// }

		self.targetEle.selectAll(".boundary")
			.transition()
				.duration(500) 
				.remove();
	}

	/////// Helper method to determine x position of a given rectangle /////// 
	function position(d) {
		var newP = self.draggedPositions[d[self.xAttr]];
		return newP == null ? self.xScale(d[self.xAttr]) : newP;
	}

	/////// Sorts the entire dataset and updates the visualization /////// 
	function sortAndUpdateRects(curNode, asc) {
		if (self.selectedBars.includes(curNode)) {
			var barsToSort = [];
			if (self.selectedBars.length==2) {
				barsToSort = self.selectedRange;
			} else {
				barsToSort = self.selectedBars;
			}

			if (curNode[self.yAttr]==d3.max(self.selectedBars.map(k => k[self.yAttr]))) {
				if (asc) {
					barsToSort.sort((a, b) => b[self.yAttr] - a[self.yAttr]);
				} else {
					barsToSort.sort((a, b) => a[self.yAttr] - b[self.yAttr]);
				}
			}
			
			for (var i = 0, j = 0; i < self.data.length; i++) {
				if (barsToSort.includes(self.data[i])) {
					self.data[i] = barsToSort[j];
					j++;
				}
			}
			
		} else {
			if (curNode[self.yAttr]==d3.max(self.data.map(k => k[self.yAttr]))) {
				if (asc) {
					self.data.sort((a, b) => b[self.yAttr] - a[self.yAttr]);
				} else {
					self.data.sort((a, b) => a[self.yAttr] - b[self.yAttr]);
				}
			}	
		}
		
		self.xScale.domain(self.data.map(d => d[self.xAttr]))

		var allBars = self.targetEle.selectAll('.barRect');
		
		allBars.classed("barSemiActive", d => {
			if (self.selectedRange.map(d => d[self.xAttr]).includes(d[self.xAttr]) && 
				! self.selectedBars.map(d => d[self.xAttr]).includes(d[self.xAttr])) {
				return true;
			} else {
				return false;
			}
		});

		allBars.classed("barActive", d => {
			if (self.selectedBars.map(d => d[self.xAttr]).includes(d[self.xAttr])) {
				return true;
			} else {
				return false;
			}
		});

		allBars.data(self.data, d => d[self.xAttr])
			.transition().duration(1000)
				.attr("transform", (d) => {
					return `translate(${self.xScale(d[self.xAttr])},${self.yScale(d[self.yAttr])})`;
				})
	}

	function getAllBarsInRange() {
		self.selectedRange = [];
		var startIndex = self.data.map(d => d[self.xAttr]).indexOf(self.selectedBars[0][self.xAttr]),
			endIndex = self.data.map(d => d[self.xAttr]).indexOf(self.selectedBars[1][self.xAttr]);
		for (var i = startIndex; i <= endIndex; i++) {
			self.selectedRange.push(self.data[i]);
		}
	}

	return {
		setTargetId,
		setData,
		setMargin,
		setBars,
		setSelection,
		setXScale,
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