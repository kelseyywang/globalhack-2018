import React, { Component } from 'react';
import firebase from './firebase.js';
import './App.css';
import 'handsontable/dist/handsontable.full.css';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
// import 'handsontable-pro/dist/handsontable.full.css';
// import { HotTable } from '@handsontable-pro/react';

class App extends Component
{
  render()
  {
    return (
      <div className="App">
        <div className="App-header">
          <h1> Welcome to SLaftey Net </h1>
        </div>
        <TableManager providerList="healthcare-providers" />
        <TableManager providerList="childcare-providers" />

      </div>
    );
  }
}

class TableManager extends Component
{
  constructor(props)
  {
    super(props);
    this.state = {
      providerList: props.providerList,
      hotData: [],
      dataFields: []
    }
    this.hotSettings = {
      data: [],
      rowHeaders: false,
      fixedRowsTop: 1,
      cells: function (row, col) {

      }
    }
    this.hotTableComponent = React.createRef();
    // add hook for handsontable afterChange hook https://docs.handsontable.com/pro/6.0.1/Hooks.html#event:afterChange
    // use firebase update https://firebase.google.com/docs/database/web/read-and-write
    // adding a new column should add a new field in TRACKED-DATA
  }

  componentDidMount() {
    console.log("mounted");
    const infoRef = firebase.database().ref("web-app").child("provider-lists").child(this.state.providerList);
    infoRef.on('value', (snapshot) => {
      let items = snapshot.val();
      let newData = [];
      for (let item in items) {
        if (item === "TRACKED-DATA")
        {
          this.setState({
            dataFields: items[item]
          });
          newData.push(items[item]);
        }
        else if (item !== "TRACKED-DATA")
        {
          var newItem = {
            id: item
          };
          for (let i = 0; i < this.state.dataFields.length; i++)
          {
            newItem[this.state.dataFields[i]] = items[item][this.state.dataFields[i]];
          }
          newData.push(newItem);
          // {
          //   id: item,
          //   ["ADDRESS"]: items[item].ADDRESS,
          //   name: items[item].NAME,
          //   hours: items[item].HOURS,
          //   languages: items[item].LANGUAGES
          // }
          console.log(items[item].ADDRESS);
          console.log(newData);
        }
      }
      this.setState({
        hotData: newData
      });
      this.loadDataFromFirebase();
    });
  }

  loadDataFromFirebase()
  {
    var newData = [];
    console.log(newData);
    var colHeaders = this.state.hotData[0];
    for (let i = 0; i < this.state.hotData.length; i++)
    {
      if (i === 0) {
        newData.push(this.state.hotData[i]);
      }
      else {
        var newItem = [];
        for (let j = 0; j < colHeaders.length; j++)
        {
          newItem[j] = this.state.hotData[i][colHeaders[j]];
        }
        newData.push(newItem);
        // newData.push([
        //   this.state.hotData[i].name,
        //   this.state.hotData[i]["ADDRESS"],
        //   this.state.hotData[i].languages,
        //   this.state.hotData[i].hours,
        //
        // ]);
      }
    }
    this.hotTableComponent.current.hotInstance.loadData(newData);
  }

 firstRowRenderer(instance, td, row, col, prop, value, cellProperties) {
    Handsontable.renderers.TextRenderer.apply(this, arguments);
    td.style.fontWeight = 'bold';
    td.style.color = 'green';
    td.style.background = '#CEC';
  }

  handleAddClick(type)
  {
    if (type === "COLUMN") {
      // var newColumnHeaders = this.hotTableComponent.current.hotInstance.getColHeader();
      // newColumnHeaders.push("NEW COL HEADER");
      // console.log(newColumnHeaders);
      // this.hotTableComponent.current.hotInstance.updateSettings({
      //   colHeaders: newColumnHeaders
      // });
      // this.hotSettings.colHeaders = newColumnHeaders;
      this.hotTableComponent.current.hotInstance.alter('insert_col', this.state.hotData[0].length);
      this.state.hotData[0][this.state.hotData[0].length - 1] = "NEW COL";
    }
    else if (type === "ROW") {
      this.hotTableComponent.current.hotInstance.alter('insert_row', 1);
    }

    this.hotTableComponent.current.hotInstance.render();
    console.log(this.hotTableComponent.current.hotInstance.getData());
  }

  render() {
    return (
      <div className="TableManager">
        <button onClick={() => this.handleAddClick("COLUMN")}>
          ADD NEW DATA FIELD
          </button>
          <button onClick={() => this.handleAddClick("ROW")}>
            ADD NEW ENTRY
            </button>
        <div id="hot-app">
          <HotTable
            ref={this.hotTableComponent}
            settings={this.hotSettings} />
        </div>
      </div>
    );
  }
}

class TextBox extends Component
{
  constructor(props)
  {
      super(props);
      this.state = {

      }
  }

  render()
  {
    return (
      <input type="text" ></input>
    );
  }
}

export default App;
