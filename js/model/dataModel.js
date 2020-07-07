"use strict"

var App = App || {};

let DataModel = function() {
    let self = {
        simpleBarData: [],
        groupedBarData: [],
        matrixData: [],
    };

    // Method that handles loading the dataset
    function loadSimpleBarChartData() {
        return d3.tsv("./data/alphabets.tsv", {credentials: 'same-origin'})
            .then(r => {
                self.barData = r;
            });
    }

    // Method that returns the dataset to caller
    function getSimpleBarChartData() {
        return deepCopy(self.barData);
    }

    // Method that handles loading the dataset
    function loadMatrixData() {
        return d3.csv("./data/countries.csv", {credentials: 'same-origin'})
            .then(r => {
                self.matrixData = r;
            });
    }

    // Method that returns the dataset to caller
    function getMatrixData() {
        return deepCopy(self.matrixData);
    }

    // Method that handles loading the dataset
    function loadGroupedBarChartData() {
        return d3.csv("./data/groupedData.csv", {credentials: 'same-origin'})
            .then(r => {
                self.groupedBarData = r;
            });
    }

    // Method that returns the dataset to caller
    function getGroupedBarChartData() {
        return deepCopy(self.groupedBarData);
    }

    function deepCopy(obj) {
        var output, v, key;
        output = Array.isArray(obj) ? [] : {};
        for (key in obj) {
            v = obj[key];
            output[key] = (typeof v === "object") ? deepCopy(v) : v;
        }
        return output;
    }

    return {
        loadSimpleBarChartData,
        getSimpleBarChartData,
        loadMatrixData,
        getMatrixData,
        loadGroupedBarChartData,
        getGroupedBarChartData,
    };
}