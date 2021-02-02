import groupBy from 'lodash/groupBy';

export function getGroupedTraces({ columns, records }, groupByColumn, marker) {
    const idIndex = columns.indexOf('id');
    const xIndex = columns.indexOf('x');
    const yIndex = columns.indexOf('y');
    const groupIndex = columns.indexOf(groupByColumn);
    const groups = groupBy(records, groupIndex);

    return Object.entries(groups).map(([key, values]) => ({
        name: key,
        ids: values.map(v => String(v[idIndex])),
        x: values.map(v => v[xIndex]),
        y: values.map(v => v[yIndex]),
        mode: 'markers',
        type: 'scattergl',
        hoverinfo: 'name',
        marker,
    }));
}

export function getContinuousTrace({ columns, records }, valueColumn, marker) {
    const idIndex = columns.indexOf('id');
    const xIndex = columns.indexOf('x');
    const yIndex = columns.indexOf('y');
    const typeIndex = columns.indexOf('type');
    const valueIndex = columns.indexOf(valueColumn);

    return {
        x: records.map(r => r[xIndex]),
        y: records.map(r => r[yIndex]),
        hovertext: records.map(r => `${+r[valueIndex].toPrecision(4)} (${r[typeIndex]})`),
        ids: records.map(r => String(r[idIndex])),
        mode: 'markers',
        type: 'scattergl',
        hoverinfo: 'text',
        marker: { 
            color: records.map(r => r[valueIndex]),
            ...marker,
        }
    };
}