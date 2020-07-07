// View Model to handle the bar chart ordering via drag interaction

/* Authors: Bharat Kale <bkale@niu.edu>
			
   Version: 1.0.0
   Date: 05-28-2020
*/
"use strict"

var App = App || {};

let BarChartOrdering = function() {

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
		selectedBars: null,
		draggedPositions: {},
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
		if (self.selectedBars==null) {
			self.selectedBars = bars;
		}
		return this;
	}

	function setSelection(sel) {
		self.selectedBars = sel;
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
		self.draggedPositions[d[self.xAttr]] = self.xScale(d[self.xAttr])
		d3.select(this).raise().classed("barActive", true);
	}

	function dragged(d) {
		self.draggedPositions[d[self.xAttr]] = Math.min(self.xScale.range()[1], Math.max(0, d3.event.x))
		self.data.sort((a, b) => position(a) - position(b));
		self.xScale.domain(self.data.map(k => k[self.xAttr]))
		self.bars.attr('transform', d => `translate(${position(d)},${self.yScale(d[self.yAttr])})`);
		self.targetEle.selectAll(`.${self.xTickCls}`)
				.attr("x", d => self.margin.left+self.xScale(d)+self.xScale.bandwidth()/2);
	}

	function dragended(d,i) {
		delete self.draggedPositions[d[self.xAttr]];
		d3.select(this).transition()
			.duration(500)
			.attr("transform", d => `translate(${position(d)},${self.yScale(d[self.yAttr])})`);
		d3.select(this).classed("barActive", false);

		if (d3.event.x>self.xScale.range()[1]) { 
			d3.select(this).select('rect').classed("mouseOver", false);
			if (d3.select(this).attr('class')=='max rect') {
				sortAndUpdateRects(false)
			}
		} else if (d3.event.x<self.xScale.range()[0]) { 
			d3.select(this).select('rect').classed("mouseOver", false);
			if (d3.select(this).attr('class')=='max rect') {
				sortAndUpdateRects(true)
			}
		}

		self.targetEle.selectAll(`.${self.xTickCls}`)
			.transition()
				.duration(1000) 
				.attr("x", d => self.margin.left+self.xScale(d)+self.xScale.bandwidth()/2);
	}

	/////// Helper method to determine x position of a given rectangle /////// 
	function position(d) {
		var newP = self.draggedPositions[d[self.xAttr]];
		return newP == null ? self.xScale(d[self.xAttr]) : newP;
	}

	/////// Sorts the entire dataset and updates the visualization /////// 
	function sortAndUpdateRects(asc) {
		if (asc) {
			self.data.sort((a, b) => b[self.yAttr] - a[self.yAttr]);
		} else {
			self.data.sort((a, b) => a[self.yAttr] - b[self.yAttr]);
		}
		self.xScale.domain(self.data.map(d => d[self.xAttr]))
		var g = self.targetEle.selectAll('g > g')
					.data(self.data, d => d[self.xAttr])
					.transition().duration(1000)
						.attr("transform", (d) => {
								return `translate(${self.xScale(d[self.xAttr])},${self.yScale(d[self.yAttr])})`;
							})
						.attr("class", d => {
							return d[self.yAttr]==d3.max(self.data.map(k => k[self.yAttr])) ? "max rect" : "rect";
						})

		g.selectAll("rect")
			.attr("height", d => {
				return self.yScale(0) - self.yScale(d[self.yAttr]);
			})
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