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
        return self.barData;
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
        return self.matrixData;
    }

    // Method that handles loading the dataset
    function loadGroupedBarChartData() {
        return d3.csv("./data/countries.csv", {credentials: 'same-origin'})
            .then(r => {
                self.groupedBarData = r;
            });
    }

    // Method that returns the dataset to caller
    function getGroupedBarChartData() {
        return self.matrixData;
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