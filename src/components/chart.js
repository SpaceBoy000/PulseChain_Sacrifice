import { useEffect, useState } from 'react';
import Chart from 'react-apexcharts'

function BarChart({weekProfits}) {

    useEffect(() => {
        let profits=[];// = weekProfits;
        if (profits.length < 5) {
            for (let i = 0; i <= 5 - profits.length; i++) {
                profits.push(0);
            }
        }
        profits.forEach((item, index) => {
            options0.xaxis.categories.push(`Week ${index+1}`);
            series0[0].data.push(item);
            if (index == 5) return;
        });
        setOptions(options0);
        setSeries(series0);
    }, [weekProfits])

    let options0 = 
    {
        chart: {
            id: 'apexchart-example',
            grid: {
                show: false,
            },
            toolbar: {
                show: false,
            },
        },
        xaxis: {
            categories: []
        },
        title: {
            text: 'Weekly Profits',
            style: {
                fontSize: '30px',
                fontFamily:'Roboto',
                fontWeight:'500',
                color:'white',
                align:'center',

            }
        }
    }
    let series0 =  
        [{
            name: 'Rewards:',
            data: []
        }]

    const [options, setOptions] = useState(options0);
    const [series, setSeries] = useState(series0);
    
    return (
        <Chart options={options} series={series} type="bar" className="w-full h-auto"/>
    )
}

export default BarChart;