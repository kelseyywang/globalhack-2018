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
  constructor(props)
  {
    super(props);
    this.state = {
      showProviderList: false,
      currentProviderList: "childcare-providers"
    };
  }

  setProvider(providerList)
  {
    console.log("setting to provider list: " + providerList);
    this.setState({
      showProviderList: true,
      currentProviderList: providerList
    });
  }

  showDashboard()
  {
    this.setState({
      showProviderList: false
    });
  }

  renderProviderManager(providerListName)
  {
    if (this.state.showProviderList) {
      console.log("showing provider list");
      return (
        <ProviderManager reloadFromFirebase={true} providerList={providerListName} goBack={() => this.showDashboard()} />
      );
    }
  }

  renderDashboardManager()
  {
    if (!this.state.showProviderList) {
      console.log("showing provider list");
      return (
        <DashboardView onSetProvider={providerList => this.setProvider(providerList)} />
      );
    }
  }

  render()
  {
    const providerManagerStyle = this.state.showProviderList ? {} : {display: 'none'} ;
    return (
      <div className="App">
        <div className="App-header">
          <h1> Welcome to SLaftey Net </h1>
        </div>

        <div>
          {this.renderDashboardManager()}
        </div>
        <div>
          {this.renderProviderManager(this.state.currentProviderList)}
        </div>
      </div>
    );
  }
}

class DashboardView extends Component
{
  render()
  {
    return (
      <div className="DashboardView">
        <div className="Dashboard-content">
          <h1> Select a provider list </h1>
          <ul>
            <li> <button className="ProviderSelect" onClick={() => this.props.onSetProvider("healthcare-providers")}> Healthcare </button> </li>
            <li> <button className="ProviderSelect" onClick={() => this.props.onSetProvider("childcare-providers")}> Child Care </button> </li>
            <li> <button className="ProviderSelect"> Legal Services </button> </li>
            <li> <button className="ProviderSelect"> Employment Services </button> </li>
          </ul>
        </div>
      </div>
    );
  }
}

class ProviderManager extends Component
{
  constructor(props)
  {
    super(props);
  }

  render()
  {
    return (
      <div>
        <button className="providerManagerButton" onClick={() => this.props.goBack()}> BACK </button>
        <TableManager providerList={this.props.providerList} />
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
    this.pullFromFirebase();
  }

  pullFromFirebase()
  {
    const infoRef = firebase.database().ref("web-app").child("provider-lists").child(this.state.providerList);
    infoRef.once('value', (snapshot) => {
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
      this.state.hotData[0][this.state.hotData[0].length - 1] = "NEW COL"; // TODO: fix state mutation
    }
    else if (type === "ROW") {
      this.hotTableComponent.current.hotInstance.alter('insert_row', 1);
    }

    this.hotTableComponent.current.hotInstance.render();
    console.log(this.hotTableComponent.current.hotInstance.getData());
  }

  render() {
    if (this.props.reloadFromFirebase)
    {
      console.log("RELOAD");
      this.props.reloadFromFirebase = false;
      this.loadDataFromFirebase();
    }
    return (
      <div className="TableManager">
        <div className="ToolBar">
          <div className="LeftDock">
            <button onClick={() => this.handleAddClick("COLUMN")}>
              ADD NEW DATA FIELD
            </button>
          </div>
          <div className="RightDock">
            <button onClick={() => this.handleAddClick("ROW")}>
              ADD NEW ENTRY
            </button>
          </div>
        </div>
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
