import React, { Component } from 'react';
import firebase from './firebase.js';
import './App.css';
import 'handsontable/dist/handsontable.full.css';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
// import 'handsontable-pro/dist/handsontable.full.css';
// import { HotTable } from '@handsontable-pro/react';

class App extends Component {
  constructor(props)
  {
    super(props);
    this.state = {
      providerList: "healthcare-providers",
      hotData: []
    }
    this.hotSettings = {
      data: [
        ["NAME", "ADDRESS", "HOURS", "LANGUAGES", "FREE CLINIC"],
        ["some hospital", "17979 sample dr., st. louis, mo, 12345", "9 - 5", "English, Spanish", "Yes"]
      ],
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
        if (item !== "TRACKED-DATA")
        {
          newData.push({
            id: item,
            ["ADDRESS"]: items[item].ADDRESS,
            name: items[item].NAME,
            hours: items[item].HOURS,
            languages: items[item].LANGUAGES
          });
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
    for (let i = 0; i < this.state.hotData.length; i++)
    {
      newData.push([
        this.state.hotData[i].name,
        this.state.hotData[i].ADDRESS,
        this.state.hotData[i].hours,
        this.state.hotData[i].languages
      ]);
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
      this.hotTableComponent.current.hotInstance.alter('insert_col', this.hotSettings.data[0].length);
      this.hotSettings.data[0][this.hotSettings.data[0].length - 1] = "NEW COL";
    }
    else if (type === "ROW") {
      this.hotTableComponent.current.hotInstance.alter('insert_row', 1);
    }

    this.hotTableComponent.current.hotInstance.render();
    console.log(this.hotTableComponent.current.hotInstance.getData());
  }

  render() {
    return (
      <div className="App">
        Welcome to SLafety Net.
        <TextBox />
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

class Table extends Component
{

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
