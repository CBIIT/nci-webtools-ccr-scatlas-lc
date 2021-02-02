import groupBy from 'lodash/groupBy';

export function getGroupedTraces({ columns, records }, groupByColumn, marker) {
    const idIndex = columns.indexOf('id');
    const xIndex = columns.indexOf('x');
    const yIndex = columns.indexOf('y');
    const groupIndex = columns.indexOf(groupByColumn);
    const groups = groupBy(records, groupIndex);

    return Object.entries(groups).map(([key, values]) => ({
        name: key,
        ids: values.map(v => v[idIndex]),
        x: values.map(v => v[xIndex]),
        y: values.map(v => v[yIndex]),
        mode: 'markers',
        type: 'scattergl',
        hoverinfo: 'name',
        marker,
    }));
}

export function getContinuousTrace({ columns, records }, valueColumn, marker) {
    const xIndex = columns.indexOf('x');
    const yIndex = columns.indexOf('y');
    const valueIndex = columns.indexOf(valueColumn);

    return {
        x: records.map(r => r[xIndex]),
        y: records.map(r => r[yIndex]),
        mode: 'markers',
        type: 'scattergl',
        hoverinfo: 'name',
        marker: { 
            color: records.map(r => r[valueIndex]),
            ...marker,
        }
    };
}