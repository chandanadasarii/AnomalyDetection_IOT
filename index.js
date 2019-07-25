// const _ = require('lodash');

// const numbers = [33,24,34,32,1]

// _.each(numbers,function(number,i){
// console.log(number);
// });

var data = {};

function getData(url, callback){
    var req = new XMLHttpRequest();
    req.onreadystatechange = function(){
        if(this.status==200){
            callback(JSON.parse(this.responseText));
        }
    };    
    req.open("GET", url, true);
    req.send();
}

function parseDateList(list) {
    return list.map((ds)=>{
        ds = ds.toString();
        year = 2000 + parseInt(ds.substr(0,2));
        month = parseInt(ds.substr(2,2))-1;
        day = parseInt(ds.substr(4,2));
        hh = parseInt(ds.substr(6,2));
        mm = parseInt(ds.substr(8,2));
        return new Date(year, month, day, hh, mm)
    })
}

window.onload = function(){
    
    getData('./data/predicted_sensor.json', function(sdata){
        data.predicted = sdata;
        getData('./data/sensors_data.json', function(adata){
            data.actual = adata;
            getData('./data/binaryAnomaly.json', function(badata){
                data.anomaly = badata;
                delete data.anomaly.FIELD1;
                
                data.timeSteps = parseDateList(data.anomaly.utime); 
                delete data.anomaly.utime;

                var sensors = Object.keys(data.actual);
                drawControls(sensors);
                
                // drawChart(actual, predicted)
            });

            var sensors = Object.keys(data.actual);
            drawControls(sensors);
            
            // drawChart(actual, predicted)
        });
    });

}

function dummy1(e){
    // console.log(e.value);
    // drawChart(actual, predicted)
    otherSensors = Object.keys(data.anomaly).filter(sensor => {
        return sensor!=data.selectedSensor
      });
      
    otherSensorResults = otherSensors.map(sensor => {
        selectedAnomalies = data.anomaly[data.selectedSensor];
        comparedAnomalies =  data.anomaly[sensor];
    
        result = selectedAnomalies.map((value,index)=> {
            return value && comparedAnomalies[index];
         })
       return { sensor: sensor, result:result }
    });
    
    data.sensorsPerTimeStep = data.timeSteps.map((value,index)=> {
        validSensors = otherSensorResults.map(sensorResult => {
             if(sensorResult.result[index] > 0){
               return sensorResult.sensor;
             }
             return null;
           });
        return validSensors;
        }).map(sensors => {
          return sensors.filter(sensor => sensor != null)
        }).map((sensorNames, index) => {
            return {
                time: data.timeSteps[index],
                names: sensorNames
            }
        });  
    
    var anomaly = data.anomaly[data.selectedSensor]
        .map((value,index) => {
        return [data.timeSteps[index], 
        value? data.plot.predicted[index][1] : null] })
        .map((value, index)=>{
            value[1] = data.sensorsPerTimeStep[index].names.length >= parseInt(e.value) ? value[1] : null
            return value;
        }); 
    drawChart(data.plot.actual, data.plot.predicted, anomaly)
}

function dummy2(e){
    data.plot = {};
    data.selectedSensor = e.value;
    data.plot.actual = data.actual[e.value];
    data.plot.predicted = data.predicted[e.value];

    data.plot.actual = Object.keys(data.plot.actual).map(function(key){
        return data.plot.actual[key];
        })
        .map((value,index) => {
            return [data.timeSteps[index], value] });;
    
    data.plot.predicted = Object.keys(data.plot.predicted).map(function(key){
            return data.plot.predicted[key];
            })
            .map((value,index) => {
                return [data.timeSteps[index], value] });

    drawChart(data.plot.actual, data.plot.predicted)
}


function drawControls(sensors){
    var html = '';
    for(i=0;i<sensors.length;i++){
        html += '<option value="'+ sensors[i]+'">'+sensors[i]+'</option>';
    }
    document.getElementById('drp-sensor')
    .innerHTML = html;
}

function drawChart(actual, predicted, anomaly){
    var chartConfig = {
        chart: {
            zoomType: 'xy'
        },

        title: {
            text: 'Actual Vs Predicted data'
        },
    
        subtitle: {
            text: 'Anomaly Detection'
        },
        xAxis: {
            type: 'datetime',
            },
        yAxis: {
            title: {
                text: 'data'
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'left'
        },
    
        plotOptions: {
            series: {
                label: {
                    connectorAllowed: false
                },
                pointStart: 1000
            }
        },
    
        series: [{
            name: 'Actual',
            data: actual
        }, {
            name: 'Predicted',
            data: predicted
        }
        ],
    
        responsive: {
            rules: [{
                condition: {
                    maxWidth: 500
                },
                chartOptions: {
                    legend: {
                        layout: 'horizontal',
                        align: 'center',
                        verticalAlign: 'bottom'
                    }
                }
            }]
        }
    
    };

    if(anomaly){
        chartConfig.series.push({
            name : 'Anomaly',
            data: anomaly,
            lineWidth: 5,
            dashStyle:'dot',
            color: 'red',
        });
        
        chartConfig.tooltip = {
            formatter: function() {
                if(this.series.name=='Anomaly') {
                sensorDetails = data.sensorsPerTimeStep.find((sensor)=>{
                   return sensor.time.getTime() == this.x.getTime()   
                })


                return sensorDetails && sensorDetails.names.length > 0 ? 'Sensors : '+ sensorDetails.names.join(', ') : 'No data';
            }

            return this.y;
            }
        }
    }

    Highcharts.chart('container', chartConfig);
}