"use strict"

var App = App || {};

let DataModel = function() {
    let self = {
        barData: [],
        matrixData: [],
    };

    // Method that handles loading the dataset
    function loadBarChartData() {
        return d3.tsv("./data/alphabets.tsv", {credentials: 'same-origin'})
            .then(r => {
                self.barData = r;
            });
    }

    // Method that returns the dataset to caller
    function getBarChartData() {
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

    return {
        loadBarChartData,
        getBarChartData,
        loadMatrixData,
        getMatrixData,
    };
}